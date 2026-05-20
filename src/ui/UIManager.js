import { NPC_DIALOGUES } from '../content/dialogueContent.js';

// 问答题库，包含 8 道精选常识题
const QUIZ_BANK = [
    { q: "“光年”是以下哪种物理量的单位？", a: ["时间", "距离", "速度", "亮度"], correct: 1 },
    { q: "太阳系中自转速度最快的是哪一颗行星？", a: ["地球", "火星", "木星", "水星"], correct: 2 },
    { q: "白炽灯是由哪位发明家改良并成功实现商业推广的？", a: ["爱因斯坦", "特斯拉", "爱迪生", "牛顿"], correct: 2 },
    { q: "以下哪种食物通常含有最丰富的维生素 C？", a: ["猕猴桃", "牛肉", "米饭", "牛奶"], correct: 0 },
    { q: "计算机中的 CPU 指的是什么？", a: ["显卡", "中央处理器", "内存条", "硬盘驱动器"], correct: 1 },
    { q: "地球上最大的海洋是哪一个？", a: ["大西洋", "印度洋", "北冰洋", "太平洋"], correct: 3 },
    { q: "植物进行光合作用，主要吸收空气中的哪种气体？", a: ["氧气", "二氧化碳", "氮气", "稀有气体"], correct: 1 },
    { q: "世界上流经国家最多的河流是哪一条？", a: ["亚马逊河", "尼罗河", "多瑙河", "密西西比河"], correct: 2 }
];

export class UIManager {
    /**
     * @param {GameState} gameState
     * @param {FarmSystem} farmSystem
     * @param {Player} player
     * @param {Taxi} taxi
     */
    constructor(gameState, farmSystem, player, taxi) {
        this.gameState = gameState;
        this.farmSystem = farmSystem;
        this.player = player;
        this.taxi = taxi;
        
        // 物品中文映射与图标
        this.itemsMeta = {
            carrot_seed: { name: '胡萝卜种子', icon: '🌱', price: 5, desc: '可在农田播种，需要浇水' },
            cabbage_seed: { name: '卷心菜种子', icon: '🌱', price: 8, desc: '绿油油的蔬菜种子' },
            pumpkin_seed: { name: '南瓜种子', icon: '🌱', price: 12, desc: '可以种出巨大的南瓜' },
            carrot: { name: '胡萝卜', icon: '🥕', price: 15, desc: '成熟的甜甜胡萝卜，可出售' },
            cabbage: { name: '卷心菜', icon: '🥬', price: 25, desc: '爽口脆嫩的圆白菜，可出售' },
            pumpkin: { name: '南瓜', icon: '🎃', price: 40, desc: '金灿灿的饱满南瓜，可出售' },
            bread: { name: '罗森面包', icon: '🍞', price: 10, satiety: 30, desc: '吃掉它可以恢复 30% 饱食度' },
            soda: { name: '汽水', icon: '🥤', price: 15, satiety: 45, desc: '好喝的汽水，恢复 45% 饱食度' }
        };
        
        this.activeTrigger = null; // 当前靠近的 Trigger
        this.dialogueState = {
            isOpen: false,
            npcId: null,
            topicId: null,
            line: '',
        };
        
        // 缓存 DOM 节点
        this.modalContainer = document.getElementById('modal-container');
        this.actionPrompt = document.getElementById('action-prompt');
        this.inventoryHud = document.getElementById('inventory-hud');
        this.toggleInventoryButton = document.getElementById('btn-toggle-inventory');
        this.npcTalkCue = document.getElementById('npc-talk-cue');
        this.npcTalkName = document.getElementById('npc-talk-name');
        this.dialoguePanel = document.getElementById('npc-dialogue-panel');
        this.dialogueAvatar = document.getElementById('dialogue-avatar');
        this.dialogueName = document.getElementById('dialogue-name');
        this.dialogueRole = document.getElementById('dialogue-role');
        this.dialogueLine = document.getElementById('dialogue-line');
        this.dialogueOptions = document.getElementById('dialogue-options');
        
        // 绑定状态广播监听
        window.addEventListener('state-change', (e) => this.renderHUD(e.detail.type, e.detail.state));
        window.addEventListener('farm-plot-updated', (e) => {
            if (this.activeTrigger?.type === 'farm_plot' && this.activeTrigger.plotIndex === e.detail.plotIndex) {
                this.updateFarmModal(e.detail.plotIndex);
            }
        });
        
        // 初始化绑定 DOM 事件
        this.initEvents();
        if (new URLSearchParams(window.location.search).get('autostart') === '1') {
            window.setTimeout(() => this.startGame(), 0);
        }
        
        // 初始化一次 HUD 界面
        this.renderHUD('all', this.gameState);
    }

    startGame() {
        const welcome = document.getElementById('welcome-screen');
        welcome.style.opacity = '0';
        window.setTimeout(() => welcome.classList.add('hidden'), 300);
    }
    
    initEvents() {
        // 1. 开始游戏按钮
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('btn-close-dialogue').addEventListener('click', () => {
            this.closeNpcDialogue();
        });
        
        // 2. 全局弹窗通用关闭按钮
        const closeBtns = document.querySelectorAll('.close-btn');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // 点击阴影处关闭弹窗
        this.modalContainer.addEventListener('click', (e) => {
            if (e.target === this.modalContainer) {
                this.closeAllModals();
            }
        });
        
        // 3. 打车按钮
        document.getElementById('btn-call-taxi').addEventListener('click', () => {
            this.openModal('modal-taxi');
        });

        this.toggleInventoryButton.addEventListener('click', () => {
            this.toggleInventoryPanel();
        });

        document.getElementById('btn-town-menu').addEventListener('click', () => {
            this.toggleInventoryPanel();
        });
        
        // 4. 打车目的地按钮绑定
        const destBtns = document.querySelectorAll('.dest-btn');
        destBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dest = e.currentTarget.getAttribute('data-dest');
                this.handleTaxiOrder(dest);
            });
        });
        
        // 5. 农田浇水与收割按钮
        document.getElementById('btn-water-crop').addEventListener('click', () => {
            if (this.activeTrigger && this.activeTrigger.type === 'farm_plot') {
                const idx = this.activeTrigger.plotIndex;
                this.farmSystem.water(idx);
                this.updateFarmModal(idx);
            }
        });
        
        document.getElementById('btn-harvest-crop').addEventListener('click', () => {
            if (this.activeTrigger && this.activeTrigger.type === 'farm_plot') {
                const idx = this.activeTrigger.plotIndex;
                this.farmSystem.harvest(idx);
                this.closeAllModals();
            }
        });
        
        // 6. 学校上学按钮绑定
        document.getElementById('btn-start-class').addEventListener('click', () => {
            this.startSchoolQuiz();
        });
        document.getElementById('btn-finish-class').addEventListener('click', () => {
            this.closeAllModals();
        });
        
        // 7. 监听出租车到达和乘车完成事件
        window.addEventListener('taxi-arrived', () => {
            this.showTaxiRideOverlay('🚕 出租车已抵达！正在接您上车...', 1800);
            
            // 延迟上车，播放过渡动画
            setTimeout(() => {
                this.taxi.startRide();
                // 隐藏玩家，模拟上车
                this.player.mesh.visible = false;
            }, 1000);
        });
        
        window.addEventListener('taxi-ride-complete', (e) => {
            const dest = e.detail.destination;
            
            // 扣除车费
            this.gameState.spendCoins(5);
            
            // 瞬移玩家到下车点
            const dropoffPoint = this.taxi.roadWaypoints[dest];
            this.player.mesh.position.copy(dropoffPoint);
            // 下车时将玩家移开道路 1-2个单位，防止再次挡在马路中央
            this.player.mesh.position.x += 2;
            this.player.mesh.visible = true;
            
            // 如果是去特定地标，给任务提示
            let landmarkName = '';
            switch (dest) {
                case 'home': landmarkName = '我的家'; break;
                case 'supermarket': landmarkName = '罗森超市'; break;
                case 'market': landmarkName = '菜市场'; break;
                case 'school': landmarkName = '阳光学院'; break;
                case 'farm': landmarkName = '绿色农田'; break;
            }
            
            this.showTaxiRideOverlay(`🚕 目的地【${landmarkName}】已送达！车费已扣除 5 金币。`, 2000);
        });
    }
    
    /**
     * 实时渲染 HUD 数据到网页上
     */
    renderHUD(type, state) {
        if (type === 'all' || type === 'coins') {
            document.getElementById('coins-display').innerText = state.coins;
        }
        
        if (type === 'all' || type === 'satiety') {
            const satiety = state.satiety;
            document.getElementById('satiety-display').innerText = `${satiety}%`;
            document.getElementById('satiety-bar').style.width = `${satiety}%`;
            // 如果饥饿，进度条变红色
            if (satiety <= 20) {
                document.getElementById('satiety-bar').style.background = 'linear-gradient(90deg, #d85b5b, #ff3333)';
            } else {
                document.getElementById('satiety-bar').style.background = 'linear-gradient(90deg, #ff7a00, #ffba00)';
            }
        }
        
        if (type === 'all' || type === 'knowledge') {
            document.getElementById('knowledge-display').innerText = state.knowledge;
        }
        
        if (type === 'all' || type === 'day-new') {
            document.getElementById('day-display').innerText = `第 ${state.day} 天`;
        }
        
        if (type === 'all' || type === 'task') {
            document.getElementById('task-display').innerText = state.activeTask;
        }
        
        // 处理时间格式化 (08.25 -> "08:15")
        if (type === 'all' || type === 'time' || type === 'day-new') {
            const hours = Math.floor(state.hour);
            const minutes = Math.floor((state.hour % 1) * 60);
            const padH = String(hours).padStart(2, '0');
            const padM = String(minutes).padStart(2, '0');
            document.getElementById('time-display').innerText = `${padH}:${padM}`;
        }
        
        // 更新背包
        if (type === 'all' || type === 'inventory') {
            this.updateInventoryHUD(state.inventory);
        }
    }

    createTextElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        element.textContent = text;
        return element;
    }

    createItemInfo(meta, titleText = meta.name) {
        const info = document.createElement('div');
        info.className = 'item-info';

        const icon = this.createTextElement('span', 'item-icon', meta.icon);
        const textBlock = document.createElement('div');
        textBlock.append(
            this.createTextElement('div', 'item-name', titleText),
            this.createTextElement('div', 'item-desc', meta.desc)
        );

        info.append(icon, textBlock);
        return info;
    }

    createPriceAction(priceText, buttonClass, buttonText, disabled) {
        const price = document.createElement('div');
        price.className = 'item-price';

        const label = this.createTextElement('span', 'price-text', priceText);
        const button = this.createTextElement('button', buttonClass, buttonText);
        button.disabled = disabled;

        price.append(label, button);
        return { price, button };
    }

    toggleInventoryPanel() {
        this.inventoryHud.classList.toggle('expanded');
        this.toggleInventoryButton.setAttribute('aria-expanded', this.inventoryHud.classList.contains('expanded') ? 'true' : 'false');
    }
    
    updateInventoryHUD(inv) {
        const grid = document.getElementById('inventory-grid');
        grid.replaceChildren();
        
        Object.entries(inv).forEach(([itemId, qty]) => {
            const meta = this.itemsMeta[itemId];
            if (!meta) return;
            
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.title = `${meta.name} - ${meta.desc}`;
            
            // 只有数量 > 0 才显示卡片，或我们可以始终显示但是只有带数量的才高亮
            if (qty > 0) {
                slot.append(
                    this.createTextElement('span', 'slot-icon', meta.icon),
                    this.createTextElement('span', 'slot-count', String(qty))
                );
                
                // 如果是面包或者汽水，允许双击吃掉/喝掉
                if (itemId === 'bread' || itemId === 'soda') {
                    slot.style.cursor = 'pointer';
                    slot.addEventListener('dblclick', () => {
                        this.gameState.removeItem(itemId, 1);
                        this.gameState.addSatiety(meta.satiety);
                        this.gameState.setTask(`😋 吃掉了 [${meta.name}]，恢复了 ${meta.satiety}% 饱食度。`);
                    });
                }
            } else {
                // 空格子虚化
                const icon = this.createTextElement('span', 'slot-icon', meta.icon || '❓');
                icon.style.opacity = '0.15';
                slot.append(icon);
                slot.style.opacity = '0.4';
            }
            grid.appendChild(slot);
        });
    }
    
    /**
     * 弹出某个指定 ID 的模态窗口
     */
    openModal(modalId) {
        this.closeNpcDialogue();

        // 先关闭所有
        const modals = document.querySelectorAll('.game-modal');
        modals.forEach(m => m.classList.add('hidden'));
        
        this.modalContainer.classList.remove('hidden');
        document.getElementById(modalId).classList.remove('hidden');
    }
    
    closeAllModals() {
        this.modalContainer.classList.add('hidden');
        const modals = document.querySelectorAll('.game-modal');
        modals.forEach(m => m.classList.add('hidden'));
    }

    setActiveWorldCue(trigger) {
        if (!this.npcTalkCue || !this.npcTalkName) return;

        if (trigger?.type === 'npc') {
            const npc = NPC_DIALOGUES[trigger.npcId];
            this.npcTalkName.textContent = npc ? `${npc.name} · ${npc.role}` : trigger.label;
            this.npcTalkCue.classList.remove('hidden');
            return;
        }

        this.npcTalkCue.classList.add('hidden');
    }
    
    /**
     * 触发具体的三维交互弹窗
     * @param {object} trigger 交互触发点数据
     */
    triggerInteraction(trigger) {
        this.activeTrigger = trigger;
        
        if (trigger.type === 'supermarket') {
            this.openSupermarketModal();
        } else if (trigger.type === 'market') {
            this.openMarketModal();
        } else if (trigger.type === 'school') {
            this.openSchoolModal();
        } else if (trigger.type === 'farm_plot') {
            this.openFarmModal(trigger.plotIndex);
        } else if (trigger.type === 'npc') {
            this.openNpcDialogue(trigger.npcId);
        } else if (trigger.type === 'home') {
            // 住宅直接触发交互：睡觉休息
            this.gameState.addSatiety(100);
            this.gameState.setTask('🏡 在家里美美睡了一大觉，饱食度与体力恢复到了 100%！');
            this.showTaxiRideOverlay('💤 睡觉休息中，呼噜噜...', 1500);
        }
    }

    openNpcDialogue(npcId) {
        const npc = NPC_DIALOGUES[npcId];
        if (!npc) {
            this.gameState.setTask('这个居民暂时没有可聊的内容。');
            return;
        }

        this.closeAllModals();

        this.dialogueState = {
            isOpen: true,
            npcId,
            topicId: null,
            line: npc.greeting,
        };

        this.dialogueAvatar.textContent = npc.avatar;
        this.dialogueName.textContent = npc.name;
        this.dialogueRole.textContent = `${npc.role} · ${npc.location} · ${npc.mood}`;
        this.dialogueLine.textContent = npc.greeting;
        this.renderDialogueOptions(npc);
        document.body.classList.add('dialogue-open');
        this.dialoguePanel.classList.remove('hidden');
    }

    renderDialogueOptions(npc) {
        this.dialogueOptions.replaceChildren();

        npc.topics.forEach((topic) => {
            const button = this.createTextElement('button', 'dialogue-option-btn', topic.label);
            button.addEventListener('click', () => this.selectDialogueTopic(npc, topic));
            this.dialogueOptions.appendChild(button);
        });

        const closeButton = this.createTextElement('button', 'dialogue-option-btn quiet', '结束交谈');
        closeButton.addEventListener('click', () => this.closeNpcDialogue());
        this.dialogueOptions.appendChild(closeButton);
    }

    selectDialogueTopic(npc, topic) {
        this.dialogueState = {
            isOpen: true,
            npcId: npc.id,
            topicId: topic.id,
            line: topic.response,
        };

        this.dialogueLine.textContent = topic.response;
        if (topic.taskText) {
            this.gameState.setTask(topic.taskText);
        }
    }

    closeNpcDialogue() {
        if (!this.dialoguePanel) return;

        this.dialoguePanel.classList.add('hidden');
        document.body.classList.remove('dialogue-open');
        this.dialogueState = {
            isOpen: false,
            npcId: null,
            topicId: null,
            line: '',
        };
    }

    getDialogueState() {
        return { ...this.dialogueState };
    }
    
    /**
     * 超市货架渲染与购买
     */
    openSupermarketModal() {
        this.openModal('modal-supermarket');
        const list = document.getElementById('supermarket-list');
        list.replaceChildren();
        
        // 售卖：种子、面包、汽水
        const goods = ['carrot_seed', 'cabbage_seed', 'pumpkin_seed', 'bread', 'soda'];
        
        goods.forEach(itemId => {
            const meta = this.itemsMeta[itemId];
            const div = document.createElement('div');
            div.className = 'shop-item';
            
            const disabled = this.gameState.coins < meta.price;
            const { price, button } = this.createPriceAction(`🪙 ${meta.price}`, 'buy-btn', '购买', disabled);
            div.append(this.createItemInfo(meta), price);
            
            // 购买事件绑定
            button.addEventListener('click', () => {
                if (this.gameState.spendCoins(meta.price)) {
                    this.gameState.addItem(itemId, 1);
                    this.openSupermarketModal(); // 刷新货架按钮状态
                }
            });
            
            list.appendChild(div);
        });
    }
    
    /**
     * 菜市场交易渲染与出售
     */
    openMarketModal() {
        this.openModal('modal-market');
        const list = document.getElementById('market-list');
        list.replaceChildren();
        
        // 回收：作物 (carrot, cabbage, pumpkin)
        const sellItems = ['carrot', 'cabbage', 'pumpkin'];
        
        sellItems.forEach(itemId => {
            const meta = this.itemsMeta[itemId];
            const div = document.createElement('div');
            div.className = 'shop-item';
            
            const qty = this.gameState.inventory[itemId] || 0;
            const disabled = qty <= 0;
            const { price, button } = this.createPriceAction(`🪙 +${meta.price}`, 'sell-btn', '出售 1 个', disabled);
            div.append(this.createItemInfo(meta, `${meta.name} (持有: ${qty})`), price);
            
            // 出售事件绑定
            button.addEventListener('click', () => {
                if (this.gameState.removeItem(itemId, 1)) {
                    this.gameState.addCoins(meta.price);
                    this.openMarketModal(); // 刷新出售状态
                }
            });
            
            list.appendChild(div);
        });
    }
    
    /**
     * 农田管理弹窗
     */
    openFarmModal(plotIndex) {
        document.getElementById('farm-index').innerText = plotIndex + 1;
        this.openModal('modal-farm');
        this.updateFarmModal(plotIndex);
    }
    
    updateFarmModal(plotIndex) {
        const plot = this.farmSystem.plots[plotIndex];
        const statusText = document.getElementById('farm-status-text');
        const progressContainer = document.getElementById('farm-progress-container');
        const seedSelector = document.getElementById('seed-selector');
        const btnWater = document.getElementById('btn-water-crop');
        const btnHarvest = document.getElementById('btn-harvest-crop');
        
        // 重置 UI
        progressContainer.classList.add('hidden');
        seedSelector.classList.add('hidden');
        btnWater.classList.add('hidden');
        btnHarvest.classList.add('hidden');
        
        if (plot.state === 'EMPTY') {
            statusText.innerText = '空地';
            seedSelector.classList.remove('hidden');
            
            // 渲染种子选择器
            const seedList = document.getElementById('farm-seed-list');
            seedList.replaceChildren();
            
            const seeds = ['carrot_seed', 'cabbage_seed', 'pumpkin_seed'];
            seeds.forEach(sId => {
                const meta = this.itemsMeta[sId];
                const qty = this.gameState.inventory[sId] || 0;
                const option = document.createElement('div');
                option.className = `seed-option ${qty <= 0 ? 'disabled' : ''}`;
                option.append(
                    this.createTextElement('div', 'seed-icon', meta.icon),
                    this.createTextElement('div', 'seed-name', meta.name.replace('种子', '')),
                    this.createTextElement('div', 'seed-qty', `拥有: ${qty}`)
                );
                
                if (qty > 0) {
                    option.addEventListener('click', () => {
                        this.farmSystem.plant(plotIndex, sId);
                        this.updateFarmModal(plotIndex);
                    });
                }
                
                seedList.appendChild(option);
            });
        } 
        else if (plot.state === 'PLANTED') {
            const config = this.farmSystem.cropConfig[plot.seedType];
            statusText.innerText = `已播种 [${config.name}] (干渴中，需浇水)`;
            btnWater.classList.remove('hidden');
        } 
        else if (plot.state === 'GROWING') {
            const config = this.farmSystem.cropConfig[plot.seedType];
            statusText.innerText = `[${config.name}] 蓬勃生长中...`;
            progressContainer.classList.remove('hidden');
            
            // 更新进度条 (在 main.js 轮询或在弹窗打开时定时更新)
            const updateProgress = () => {
                if (plot.state !== 'GROWING') return;
                const progress = ((plot.totalGrowTime - plot.growTime) / plot.totalGrowTime) * 100;
                document.getElementById('farm-progress-bar').style.width = `${Math.min(100, progress)}%`;
                
                if (progress < 100) {
                    requestAnimationFrame(updateProgress);
                } else {
                    this.updateFarmModal(plotIndex); // 成熟时刷新面板
                }
            };
            updateProgress();
        } 
        else if (plot.state === 'MATURE') {
            const config = this.farmSystem.cropConfig[plot.seedType];
            statusText.innerText = `🎉 [${config.name}] 已成熟！`;
            btnHarvest.classList.remove('hidden');
        }
    }
    
    /**
     * 学校弹窗
     */
    openSchoolModal() {
        this.openModal('modal-school');
        
        // 显示引言，重置问答
        document.getElementById('school-intro').classList.remove('hidden');
        document.getElementById('school-quiz').classList.add('hidden');
        document.getElementById('school-result').classList.add('hidden');
    }
    
    startSchoolQuiz() {
        if (this.gameState.satiety < 15) {
            alert('你实在太饿了，没力气上课！先去超市买块面包吃吧。');
            return;
        }
        
        // 隐藏引言，展示答题板
        document.getElementById('school-intro').classList.add('hidden');
        document.getElementById('school-quiz').classList.remove('hidden');
        
        // 随机挑选 3 道题
        this.quizQuestions = [...QUIZ_BANK]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
            
        this.quizIndex = 0;
        this.quizScore = 0;
        
        this.renderQuizQuestion();
    }
    
    renderQuizQuestion() {
        const qData = this.quizQuestions[this.quizIndex];
        document.getElementById('quiz-current').innerText = this.quizIndex + 1;
        document.getElementById('quiz-question').innerText = qData.q;
        
        const optContainer = document.getElementById('quiz-options');
        optContainer.replaceChildren();
        
        qData.a.forEach((optText, optIdx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.innerText = optText;
            
            btn.addEventListener('click', () => {
                // 禁用所有选项按钮防止连点
                const buttons = optContainer.querySelectorAll('button');
                buttons.forEach(b => b.disabled = true);
                
                if (optIdx === qData.correct) {
                    btn.classList.add('correct');
                    this.quizScore++;
                } else {
                    btn.classList.add('wrong');
                    // 标出正确选项
                    buttons[qData.correct].classList.add('correct');
                }
                
                // 1秒延迟进入下一题
                setTimeout(() => {
                    this.quizIndex++;
                    if (this.quizIndex < this.quizQuestions.length) {
                        this.renderQuizQuestion();
                    } else {
                        this.finishSchoolQuiz();
                    }
                }, 1200);
            });
            
            optContainer.appendChild(btn);
        });
    }
    
    finishSchoolQuiz() {
        document.getElementById('school-quiz').classList.add('hidden');
        document.getElementById('school-result').classList.remove('hidden');
        
        // 扣除 15 点饱食度
        this.gameState.consumeSatiety(15);
        
        // 计算奖励：答对一题 10 金币 + 20 知识，全对有额外暴击奖励
        const coinsReward = this.quizScore * 10 + (this.quizScore === 3 ? 15 : 0);
        const expReward = this.quizScore * 20 + (this.quizScore === 3 ? 20 : 0);
        
        document.getElementById('quiz-score-text').innerText = `小考结束！你答对了 ${this.quizScore} 道题。`;
        document.getElementById('quiz-rewards-text').innerText = `获得奖励：🪙+${coinsReward} 金币，🎓+${expReward} 知识点`;
        
        this.gameState.addCoins(coinsReward);
        this.gameState.addKnowledge(expReward);
        this.gameState.setTask(`🎓 刚才完成了一次课堂测验，学识大增！`);
    }
    
    /**
     * 自动打车订单派发
     */
    handleTaxiOrder(dest) {
        if (this.gameState.coins < 5) {
            alert('您的金币不足 5 个，打不起出租车！');
            return;
        }
        
        // 1. 根据当前玩家坐标，寻找最近的马路起点
        const fromNode = this.getNearestNode();
        
        if (fromNode === dest) {
            alert('您已经离这里非常近了，不需要打车！');
            return;
        }
        
        this.closeAllModals();
        
        // 2. 发起打车订单
        this.taxi.call(fromNode, dest, this.player);
        this.gameState.setTask('🚕 已呼叫滴滴出行！出租车正在向您驶来，请在原地等待。');
    }
    
    /**
     * 寻找距离玩家最近的马路节点
     */
    getNearestNode() {
        const p = this.player.mesh.position;
        let nearestKey = 'home';
        let minDist = Infinity;
        
        Object.entries(this.taxi.roadWaypoints).forEach(([key, wPos]) => {
            const dist = p.distanceTo(wPos);
            if (dist < minDist) {
                minDist = dist;
                nearestKey = key;
            }
        });
        
        return nearestKey;
    }
    
    /**
     * 显示乘车过程遮罩
     */
    showTaxiRideOverlay(text, duration) {
        const overlay = document.getElementById('taxi-ride-overlay');
        document.getElementById('taxi-ride-text').innerText = text;
        
        overlay.classList.add('visible');
        setTimeout(() => {
            overlay.classList.remove('visible');
        }, duration);
    }
}
