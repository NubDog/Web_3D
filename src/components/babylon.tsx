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
    PBRMaterial,
    ImageProcessingConfiguration,
    GlowLayer,
    SSAORenderingPipeline
} from '@babylonjs/core';

import '@babylonjs/loaders/glTF';
import { normalizeModel } from '../utils/babylonUtils';

interface BabylonProps {
  modelUrl: string;
  onModelLoaded?: () => void;
}

const BabylonScene: React.FC<BabylonProps> = ({ modelUrl, onModelLoaded }) => {
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
      scene.imageProcessingConfiguration.exposure = 1.5; // Tăng độ phơi sáng để cảnh rực rỡ hơn
      scene.imageProcessingConfiguration.contrast = 1.6; // Tăng độ tương phản cho hình ảnh sắc nét

      // Set màu nền background (trong suốt)
      scene.clearColor = new Color4(0, 0, 0, 0);

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 2, Vector3.Zero(), scene); // Khoảng cách camera = 2 unit (2 mét)
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; // Tăng tốc độ zoom
      camera.pinchPrecision = 200; // Tăng độ nhạy pinch-to-zoom cho touchpad
      
      // Cài đặt zoom mượt mà hơn khi ở gần model
      camera.inertia = 0.9; // Giảm inertia để zoom chính xác hơn
      camera.panningInertia = 0.9; // Giảm inertia cho pan
      
      // Đặt giới hạn zoom để tránh zoom quá xa, cho phép zoom gần vào bên trong model
      camera.lowerRadiusLimit = 0.01; // Cho phép zoom rất gần (1cm) để xem bên trong
      camera.upperRadiusLimit = 50; // Zoom xa nhất = 50 mét
      
      // Điều chỉnh near/far plane để hiển thị tốt khi zoom gần
      camera.minZ = 0.001; // Near plane rất gần (1mm) để không cắt model khi zoom
      camera.maxZ = 1000; // Far plane xa để không mất model

      // Ngăn chặn wheel events từ canvas lan ra ngoài (zoom cả trang web)
      const canvas = reactCanvas.current;
      
      const preventWheelZoom = (event: WheelEvent) => {
        // Chỉ ngăn chặn wheel events (touchpad zoom và mouse wheel)
        event.preventDefault();
        event.stopPropagation();
      };

      const preventTouchZoom = (event: TouchEvent) => {
        // Chỉ ngăn chặn khi có 2 fingers trở lên (pinch-to-zoom gesture)
        if (event.touches.length > 1) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      // Thêm event listeners
      canvas.addEventListener('wheel', preventWheelZoom, { passive: false });
      canvas.addEventListener('touchstart', preventTouchZoom, { passive: false });
      canvas.addEventListener('touchmove', preventTouchZoom, { passive: false });

      // SSAO bị tạm thời vô hiệu hóa vì gây lỗi postProcess
      let ssao: SSAORenderingPipeline | null = null;

      // Thêm hiệu ứng Glow để làm đèn và các chi tiết phát sáng
      const glowLayer = new GlowLayer("glow", scene);
      glowLayer.intensity = 1.7; // Điều chỉnh cường độ phát sáng

      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      light.intensity = 0.05; // Giảm cường độ ánh sáng

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
      
      SceneLoader.ImportMesh("", "", modelUrl, scene, 
        (meshes) => {
          // Success callback
          console.log("Model loaded successfully with", meshes.length, "meshes");
          
          if (meshes.length > 0) {
            // Gom model vào một wrapper, scale và căn chỉnh
            const modelWrapper = normalizeModel(meshes, scene);

            // Cập nhật target của camera vào tâm của model đã chuẩn hóa
            const bounds = modelWrapper.getHierarchyBoundingVectors(true);
            const center = bounds.min.add(bounds.max).scale(0.5);
            camera.target = center;

            // Điều chỉnh camera để nhìn thấy toàn bộ model
            camera.radius = 4; // Khoảng cách cố định vì model đã được scale
            camera.alpha = -Math.PI / 1; // Nhìn từ phía trước
            camera.beta = Math.PI / 2.5; // Hơi nhìn từ trên xuống
            
            console.log("Camera distance adjusted to:", camera.radius, "units");
          }

          // Nâng cấp chất liệu để trông giống sơn xe hơi cao cấp
          meshes.forEach(mesh => {
              if (mesh.material && mesh.material instanceof PBRMaterial) {
                  const pbr = mesh.material as PBRMaterial;
                  pbr.metallic = 0.7; // Tăng độ kim loại để phản chiếu mạnh hơn
                  pbr.roughness = 0.3; // Giảm độ nhám để bề mặt bóng và phản chiếu rõ nét (0 = cực bóng, 1 = rất thô)

                  // Thêm lớp sơn bóng (clear coat) để tạo chiều sâu
                  pbr.clearCoat.isEnabled = true;
                  pbr.clearCoat.intensity = 0.4; // Tăng cường độ lớp sơn bóng
                  pbr.clearCoat.roughness = 0.1; // Lớp sơn bóng mịn
                  
                  // Cho phép hiển thị cả hai mặt khi zoom vào bên trong model
                  pbr.backFaceCulling = false; // Hiển thị cả mặt trước và mặt sau
                  pbr.twoSidedLighting = true; // Ánh sáng chiếu cả hai mặt
              }
          });
          
          // Gọi callback khi model đã tải và xử lý xong
          if (onModelLoaded) {
            onModelLoaded();
          }
        },
        (progress) => {
          // Progress callback
          console.log("Loading progress:", Math.round((progress.loaded / progress.total) * 100) + "%");
        },
        (_, message, exception) => {
          // Error callback
          console.error("Lỗi khi tải model 3D:", message);
          console.error("Model URL:", modelUrl);
          console.error("Exception:", exception);
          
          // Thêm thông báo lỗi cho user
          alert(`Không thể tải model 3D!\nLỗi: ${message}\nVui lòng kiểm tra đường dẫn: ${modelUrl}`);
        }
      );

      engine.runRenderLoop(() => {
        scene.render();
      });

      const resize = () => {
        scene.getEngine().resize();
      };

      window.addEventListener("resize", resize);

      return () => {
        window.removeEventListener("resize", resize);
        
        // Cleanup event listeners để tránh memory leaks
        if (canvas) {
          canvas.removeEventListener('wheel', preventWheelZoom);
          canvas.removeEventListener('touchstart', preventTouchZoom);
          canvas.removeEventListener('touchmove', preventTouchZoom);
        }
        
        glowLayer.dispose();
        engine.dispose();
      };
    }
  }, [modelUrl, onModelLoaded]);

  return (
    <canvas 
      ref={reactCanvas} 
      tabIndex={-1} // Cho phép canvas nhận focus để xử lý events
      style={{ 
        width: '100%', 
        height: '100%',
        touchAction: 'none', // Ngăn chặn default touch behaviors (quan trọng!)
        userSelect: 'none', // Ngăn chặn text selection
        outline: 'none !important', // Xóa outline khi focus  
        border: 'none !important', // Xóa border
        boxShadow: 'none !important', // Xóa shadow nếu có
        WebkitTapHighlightColor: 'transparent' // Xóa highlight trên mobile
      }} 
    />
  );
};

export default BabylonScene;