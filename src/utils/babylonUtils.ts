import { AbstractMesh, Scene, TransformNode, Vector3 } from '@babylonjs/core';

/**
 * Phân tích và chuẩn hóa một tập hợp các mesh.
 * - Gộp tất cả các mesh gốc vào một TransformNode duy nhất.
 * - Scale wrapper để chiều lớn nhất của model có một kích thước cụ thể.
 * - Định vị lại wrapper để model được căn giữa trên trục X và Z,
 *   và mặt đáy của nó nằm trên mặt phẳng Y=0.
 *
 * @param meshes Một mảng các mesh để chuẩn hóa.
 * @param scene Scene chứa các mesh.
 * @param targetSize Kích thước mong muốn cho chiều lớn nhất của model (mặc định là 2).
 * @returns TransformNode wrapper chứa model đã được chuẩn hóa.
 */
export const normalizeModel = (
  meshes: AbstractMesh[],
  scene: Scene,
  targetSize: number = 4.0 // Kích thước của mô hình trong métmét
): TransformNode => {
  // Chỉ tìm các node gốc của các mesh đã tải
  const rootNodes = meshes.filter(mesh => !mesh.parent);

  // Tạo một node wrapper để làm parent mới cho tất cả các node gốc
  const wrapper = new TransformNode("model-wrapper", scene);
  rootNodes.forEach(mesh => mesh.setParent(wrapper));

  // Tính toán bounding box của toàn bộ hệ thống phân cấp model
  // Ta truyền 'true' để bao gồm cả các node con cháu
  const boundingVectors = wrapper.getHierarchyBoundingVectors(true);
  const size = boundingVectors.max.subtract(boundingVectors.min);
  const maxDimension = Math.max(size.x, size.y, size.z);

  // --- Scaling ---
  // Tính toán hệ số scale và áp dụng nó cho wrapper
  const scale = targetSize / maxDimension;
  if (isFinite(scale) && scale > 0) {
    wrapper.scaling.scaleInPlace(scale);
  }

  // --- Centering (đáy chạm đất) ---
  // Tính toán lại bounding box sau khi scale để có được offset chính xác
  const newBoundingVectors = wrapper.getHierarchyBoundingVectors(true);
  
  // Tính toán offset để căn giữa model trên X/Z và đặt đáy của nó tại Y=0
  const offset = new Vector3(
    -(newBoundingVectors.min.x + newBoundingVectors.max.x) / 2,
    -newBoundingVectors.min.y,
    -(newBoundingVectors.min.z + newBoundingVectors.max.z) / 2
  );
  
  // Áp dụng offset vào vị trí của wrapper
  wrapper.position.addInPlace(offset);

  return wrapper;
};
