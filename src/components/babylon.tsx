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
    HDRCubeTexture,
    ImageProcessingConfiguration
} from '@babylonjs/core';

import '@babylonjs/loaders/glTF';

interface BabylonProps {
  modelUrl: string;
}

const BabylonScene: React.FC<BabylonProps> = ({ modelUrl }) => {
  const reactCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, true, { 
        adaptToDeviceRatio: true 
      });
      const scene = new Scene(engine);
      
      // Bật Tone mapping & Gamma correction cho màu sắc chân thực
      scene.imageProcessingConfiguration.toneMappingEnabled = true;
      scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
      scene.imageProcessingConfiguration.exposure = 0.8;
      scene.imageProcessingConfiguration.contrast = 1.2;

      // Set màu nền background (trong suốt)
      scene.clearColor = new Color4(0, 0, 0, 0);

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; // Tăng tốc độ zoom

      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      light.intensity = 0.1; // Giảm cường độ ánh sáng

      // Tải HDRI để cải thiện chất lượng model và đảm bảo nó được tải xong trước khi sử dụng
      const hdrTexture = new CubeTexture(
        "/env/environment.env", 
        scene,
        null, // extensions
        false, // noMipmap
        null, // files
        () => {
          // Callback này chỉ chạy KHI texture đã tải xong
          scene.environmentTexture = hdrTexture;
          // scene.createDefaultSkybox(hdrTexture, true, 1000, 0.3); // <-- Vô hiệu hóa dòng này để ẩn background
        },
        (message, exception) => {
          // log ra lỗi nếu không tải được texture
          console.error("Lỗi khi tải HDR texture:", message, exception);
        }
      );

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

        // Nâng cấp chất liệu để trông giống sơn xe hơi cao cấp
        meshes.forEach(mesh => {
            if (mesh.material && mesh.material instanceof PBRMaterial) {
                const pbr = mesh.material as PBRMaterial;
                pbr.metallic = 0.22; // Tăng tối đa độ kim loại
                pbr.roughness = 1; // Giảm độ nhám để bề mặt bóng hơn

                // Thêm lớp sơn bóng (clear coat) để tạo chiều sâu
                pbr.clearCoat.isEnabled = true;
                pbr.clearCoat.intensity = 0.9;
                pbr.clearCoat.roughness = 0.1;
            }
        });
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