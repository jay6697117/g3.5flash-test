export class Physics {
    constructor() {
        this.colliders = []; // 阻挡性包围盒
        this.triggers = [];   // 交互触发区域
    }

    /**
     * 添加障碍物包围盒
     * @param {object} box { x, z, width, depth, label }
     */
    addCollider(box) {
        this.colliders.push({
            minX: box.x - box.width / 2,
            maxX: box.x + box.width / 2,
            minZ: box.z - box.depth / 2,
            maxZ: box.z + box.depth / 2,
            label: box.label || 'obstacle'
        });
    }

    /**
     * 添加交互区域触发器
     * @param {object} trigger { id, x, z, radius, label, type }
     */
    addTrigger(trigger) {
        this.triggers.push(trigger);
    }

    /**
     * 检测某一位置是否与障碍物发生碰撞，或超出小镇边界
     * @param {number} x 待测试的 X 坐标
     * @param {number} z 待测试的 Z 坐标
     * @param {number} radius 玩家的碰撞半径
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision(x, z, radius = 0.8) {
        // 1. 小镇外围大边界限制 (小镇底座大小为 120x120，即限速在 -58 到 58)
        const boundary = 58;
        if (Math.abs(x) > boundary || Math.abs(z) > boundary) {
            return true;
        }

        // 2. 障碍物碰撞检测 (圆与矩形 AABB 碰撞)
        for (const col of this.colliders) {
            const closestX = Math.max(col.minX, Math.min(x, col.maxX));
            const closestZ = Math.max(col.minZ, Math.min(z, col.maxZ));

            const distanceX = x - closestX;
            const distanceZ = z - closestZ;
            const distanceSquared = distanceX * distanceX + distanceZ * distanceZ;

            if (distanceSquared < radius * radius) {
                return true; 
            }
        }
        return false;
    }

    /**
     * 检查玩家当前处于哪个交互范围
     * @param {number} x 玩家当前 X
     * @param {number} z 玩家当前 Z
     * @returns {object|null} 激活状态下的 Trigger
     */
    checkTriggers(x, z) {
        for (const trig of this.triggers) {
            const dx = x - trig.x;
            const dz = z - trig.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= trig.radius) {
                return trig;
            }
        }
        return null;
    }
}
