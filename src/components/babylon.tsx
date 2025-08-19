import React, { useEffect, useRef } from 'react';

import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    SceneLoader
} from '@babylonjs/core';

import '@babylonjs/loaders/glTF';

const BabylonModulViewer = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new Engine(canvasRef.current, true);

        const scene = new Scene(engine);

        const camera = new ArcRotateCamera(
            'camera',
            0,
            Math.PI / 3,
            10,
            Vector3.Zero(),
            scene
        );

        camera.attachControl(canvasRef.current, true);

        new HemisphericLight(
            'light',
            new Vector3(0, 1, 0),
            scene
        );

        engine.runRenderLoop(() => {
            scene.render();
        })

        // load model
        const loadModel = async () => {
            try {
                console.log('🔄 Đang tải mô hình...');
                
                const result = await SceneLoader.ImportMeshAsync(
                    null, // load tất cả mesh
                    '/modul_3d/tank/source/', // đường dẫn đúng
                    'glb.glb', // tên file đúng
                    scene
                );
                
                console.log('✅ Load thành công!', result.meshes.length, 'meshes');
                
                if (result.meshes.length > 0) {
                    // 📐 Tính bounding box để center mô hình
                    let min = new Vector3(Infinity, Infinity, Infinity);
                    let max = new Vector3(-Infinity, -Infinity, -Infinity);
                    
                    result.meshes.forEach(mesh => {
                        if (mesh.getBoundingInfo) {
                            const boundingInfo = mesh.getBoundingInfo();
                            min = Vector3.Minimize(min, boundingInfo.boundingBox.minimumWorld);
                            max = Vector3.Maximize(max, boundingInfo.boundingBox.maximumWorld);
                        }
                    });
                    
                    // 🎯 Tính center và kích thước
                    const center = Vector3.Center(min, max);
                    const size = max.subtract(min);
                    const maxDimension = Math.max(size.x, size.y, size.z);
                    
                    // 📍 Di chuyển mô hình về center (0,0,0)
                    result.meshes.forEach(mesh => {
                        mesh.position = mesh.position.subtract(center);
                    });
                    
                    // 📷 Điều chỉnh camera để fit mô hình
                    camera.setTarget(Vector3.Zero());
                    camera.radius = maxDimension * 1.5; // Khoảng cách phù hợp
                    camera.alpha = -Math.PI / 4; // Góc nhìn đẹp
                    camera.beta = Math.PI / 3;
                    
                    console.log(`📏 Kích thước mô hình: ${maxDimension.toFixed(2)}`);
                    console.log(`📷 Camera radius: ${camera.radius.toFixed(2)}`);
                }
                
            } catch (error) {
                console.error('❌ Lỗi loading:', error);
                console.log('💡 Thử copy file vào public/models/ và dùng đường dẫn /models/...');
            }
        };
          
        loadModel();
          

    }, []);

    return (
        <canvas
            ref={canvasRef} 
            style={{ width: '400px', height: '400px' }}
        />
    );
};

export default BabylonModulViewer;