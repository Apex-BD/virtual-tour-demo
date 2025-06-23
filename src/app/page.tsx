"use client";

import { useEffect, useRef, useState } from "react";
import { Info, ChevronUp, ChevronDown } from "lucide-react";
import * as BABYLON from "@babylonjs/core";
import Link from "next/link";
import Image from "next/image";

export default function VideoPlayer360() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const domeRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    initializeBabylon();
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  const initializeBabylon = () => {
    if (!canvasRef.current || !BABYLON) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    engineRef.current = engine;

    let dome: any,
      tickCount = -240,
      currentZoomLevel = 1;

    const createScene = () => {
      const scene = new BABYLON.Scene(engine);
      const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        -Math.PI / 2,
        Math.PI / 2,
        5,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.attachControl(canvas, true);
      camera.inputs.attached.mousewheel.detachControl();

      dome = new BABYLON.VideoDome(
        "testdome",
        ["https://assets.babylonjs.com/photoDomes/solarProbeMission.mp4"],
        {
          resolution: 16,
          clickToPlay: false,
          useDirectMapping: false,
        },
        scene
      );

      domeRef.current = dome;

      // Set up video event listeners
      dome.videoTexture.video.addEventListener("loadeddata", () => {
        setIsLoading(false);
      });

      dome.videoTexture.video.addEventListener("play", () => {
        setIsPlaying(true);
      });

      dome.videoTexture.video.addEventListener("pause", () => {
        setIsPlaying(false);
      });

      scene.registerAfterRender(() => {
        tickCount++;
        if (currentZoomLevel == 1) {
          if (tickCount >= 0) {
            dome.fovMultiplier = Math.sin(tickCount / 100) * 0.5 + 1.0;
          }
        } else {
          dome.fovMultiplier = currentZoomLevel;
        }
      });

      scene.onPointerObservable.add((e: any) => {
        if (dome === undefined) return;
        currentZoomLevel += e.event.wheelDelta * -0.0005;
        if (currentZoomLevel < 0) currentZoomLevel = 0;
        if (currentZoomLevel > 2) currentZoomLevel = 2;
        if (currentZoomLevel == 1) {
          tickCount = -60;
        }
        setZoomLevel(currentZoomLevel);
      }, BABYLON.PointerEventTypes.POINTERWHEEL);

      return scene;
    };

    const scene = createScene();
    sceneRef.current = scene;

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });
  };

  const skipForward = () => {
    if (domeRef.current?.videoTexture?.video) {
      const video = domeRef.current.videoTexture.video;
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
    }
  };

  const skipBackward = () => {
    if (domeRef.current?.videoTexture?.video) {
      const video = domeRef.current.videoTexture.video;
      video.currentTime = Math.max(video.currentTime - 10, 0);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseEnter={() => setShowControls(true)}
        // onMouseLeave={() => setShowControls(false)}
      />

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg animate-pulse">
              Loading 360° Experience...
            </p>
          </div>
        </div>
      )}

      {/* Top UI Bar */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 transition-all duration-500 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-100"
        }`}
      >
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-xl font-bold">
              Solar Probe Mission
            </h1>
            <div className="bg-red-600 text-white px-2 py-1 rounded text-sm animate-pulse">
              360° LIVE
            </div>
          </div>
          <div>
            <Image
              src="/apexlogo.webp"
              alt="Apex Logo"
              width={140}
              height={60}
            />
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-white hover:text-blue-400 transition-colors duration-300 transform hover:scale-110"
          >
            <Info size={24} />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div
        className={`absolute top-20 right-6 bg-black/80 backdrop-blur-sm text-white p-6 rounded-lg max-w-sm transition-all duration-500 transform ${
          showInfo ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <h3 className="text-lg font-bold mb-3">Controls</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Drag to look around</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Scroll to zoom in/out</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Auto-zoom when at 1x</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Arrow buttons: skip ±10s</span>
          </li>
        </ul>
      </div>

      {/* Video Navigation Controls */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 space-y-3">
        <button
          onClick={skipForward}
          className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm group"
          title="Skip forward 10s"
        >
          <ChevronUp size={20} className="group-hover:animate-bounce" />
        </button>

        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>

        <button
          onClick={skipBackward}
          className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm group"
          title="Skip backward 10s"
        >
          <ChevronDown size={20} className="group-hover:animate-bounce" />
        </button>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/50 animate-pulse"></div>
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/50 animate-pulse"></div>
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/50 animate-pulse"></div>
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/50 animate-pulse"></div>
    </div>
  );
}
