import React, { useEffect, useRef } from 'react';

import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    SceneLoader,
    Color4,
    CubeTexture,
    Texture,
    PBRMaterial,
    HDRCubeTexture
} from '@babylonjs/core';

import '@babylonjs/loaders/glTF';

interface BabylonProps {
  modelUrl: string;
}

const BabylonScene: React.FC<BabylonProps> = ({ modelUrl }) => {
  const reactCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, true);
      const scene = new Scene(engine);
      
      // Set màu nền background
      scene.clearColor = new Color4(0, 0, 0, 0);

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; // Tăng tốc độ zoom

      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      light.intensity = 0.1; // Giảm cường độ ánh sáng cũ

      // Tải HDRI để cải thiện chất lượng model
      const hdrTexture = new HDRCubeTexture("https://playground.babylonjs.com/textures/environment.hdr", scene, 512);
      scene.environmentTexture = hdrTexture;
      scene.createDefaultSkybox(hdrTexture, true, 1000, 0.3);

      // Xóa model cũ trước khi tải model mới để tránh trùng lặp
      scene.meshes.forEach(mesh => {
        if (mesh.name !== "camera" && mesh.name !== "skyBox") { // không xóa skyBox
            mesh.dispose();
        }
      });
      
      SceneLoader.ImportMesh("", "", modelUrl, scene, (meshes) => {
        // Tự động điều chỉnh camera để nhìn thấy toàn bộ model
        scene.createDefaultCameraOrLight(true, true, true);
        if (scene.activeCamera) {
            const arcRotateCamera = scene.activeCamera as ArcRotateCamera;
            arcRotateCamera.alpha += Math.PI; // Xoay camera để nhìn từ phía trước
            arcRotateCamera.radius = meshes[0].getBoundingInfo().boundingSphere.radius * 2.5; // Điều chỉnh khoảng cách zoom
          }
      });

      engine.runRenderLoop(() => {
        scene.render();
      });

      const resize = () => {
        scene.getEngine().resize();
      };

      window.addEventListener("resize", resize);

      return () => {
        window.removeEventListener("resize", resize);
        engine.dispose();
      };
    }
  }, [modelUrl]);

  return <canvas ref={reactCanvas} style={{ width: '100%', height: '100%' }} />;
};

export default BabylonScene;