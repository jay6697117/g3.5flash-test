export class GameState {
    constructor() {
        this.coins = 100;
        this.satiety = 100; // 0 - 100
        this.knowledge = 0;
        
        // 时间系统：0.0 代表半夜12点，12.0代表中午12点
        this.hour = 8.0; 
        this.day = 1;
        
        // 1 游戏天 = 现实 5 分钟 (300 秒)
        // 也就是 1 秒现实时间 = 24 / 300 = 0.08 游戏小时
        this.timeSpeed = 0.08; 
        
        // 初始背包
        this.inventory = {
            carrot_seed: 3,      // 胡萝卜种子
            cabbage_seed: 2,     // 卷心菜种子
            pumpkin_seed: 1,     // 南瓜种子
            carrot: 0,
            cabbage: 0,
            pumpkin: 0,
            bread: 1,            // 超市面包
            soda: 1              // 汽水
        };
        
        this.activeTask = '在小镇里熟悉一下环境吧，或者尝试去农地种菜！';
        
        // 每 4 秒饱食度自然减少 1 点
        this.satietyTimer = 0;
        this.satietyDecayInterval = 4.0;
    }
    
    /**
     * 时间和状态增量更新
     * @param {number} deltaTime 帧间隔 (秒)
     */
    tick(deltaTime) {
        // 1. 游戏时间推进
        this.hour += this.timeSpeed * deltaTime;
        if (this.hour >= 24.0) {
            this.hour = 0.0;
            this.day++;
            this.triggerUpdate('day-new');
        }
        
        // 2. 饱食度自然消耗
        this.satietyTimer += deltaTime;
        if (this.satietyTimer >= this.satietyDecayInterval) {
            this.satietyTimer = 0;
            this.consumeSatiety(1);
        }
    }
    
    addCoins(amount) {
        this.coins += amount;
        this.triggerUpdate('coins');
    }
    
    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.triggerUpdate('coins');
            return true;
        }
        return false;
    }
    
    consumeSatiety(amount) {
        this.satiety = Math.max(0, this.satiety - amount);
        this.triggerUpdate('satiety');
        
        // 如果饿扁了，提示玩家
        if (this.satiety === 0) {
            this.setTask('🎒 你太饿了，移动速度减半！请前往罗森超市买面包吃。');
        }
    }
    
    addSatiety(amount) {
        this.satiety = Math.min(100, this.satiety + amount);
        this.triggerUpdate('satiety');
    }
    
    addKnowledge(amount) {
        this.knowledge += amount;
        this.triggerUpdate('knowledge');
        
        // 动态更新任务引导
        if (this.knowledge >= 100) {
            this.setTask('🎓 恭喜你成为“小镇学霸”！继续体验悠闲的生活吧！');
        }
    }
    
    addItem(itemId, count = 1) {
        if (this.inventory[itemId] !== undefined) {
            this.inventory[itemId] += count;
        } else {
            this.inventory[itemId] = count;
        }
        this.triggerUpdate('inventory');
    }
    
    removeItem(itemId, count = 1) {
        if (this.inventory[itemId] && this.inventory[itemId] >= count) {
            this.inventory[itemId] -= count;
            this.triggerUpdate('inventory');
            return true;
        }
        return false;
    }
    
    setTask(taskText) {
        this.activeTask = taskText;
        this.triggerUpdate('task');
    }
    
    /**
     * 触发广播，让 UI 模块响应数据的变化
     */
    triggerUpdate(type) {
        const event = new CustomEvent('state-change', {
            detail: {
                type: type,
                state: this
            }
        });
        window.dispatchEvent(event);
    }
}
