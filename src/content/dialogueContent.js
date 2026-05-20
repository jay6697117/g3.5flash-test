export const NPC_DIALOGUES = {
    mayaVendor: {
        id: 'mayaVendor',
        name: 'Maya',
        role: '菜市场摊主',
        avatar: '🥬',
        mood: '热情',
        location: '中心菜摊',
        greeting: '今天的菜刚摆上摊，胡萝卜和卷心菜都很新鲜。你要是有收成，也可以拿去菜市场换金币。',
        topics: [
            {
                id: 'market_tip',
                label: '问问菜价',
                response: '成熟作物最好在傍晚前卖掉。胡萝卜来钱快，南瓜更值钱，但要多一点耐心。',
                taskText: '🥬 Maya 建议你先种一批胡萝卜，再去菜市场卖掉换金币。',
            },
            {
                id: 'seed_tip',
                label: '打听种子',
                response: '种子一般在罗森超市买。播种以后别忘了浇水，否则地块会一直停在刚播种的状态。',
                taskText: '🌱 先去罗森超市补种子，再回农田播种和浇水。',
            },
        ],
    },
    theoStudent: {
        id: 'theoStudent',
        name: 'Theo',
        role: '阳光学院学生',
        avatar: '🎓',
        mood: '专注',
        location: '学院路口',
        greeting: '学校今天有小测验。答题会消耗一点饱食度，但知识点和奖学金都很划算。',
        topics: [
            {
                id: 'school_tip',
                label: '聊聊上学',
                response: '如果饱食度低于 15，就先吃点面包。精神饱满时去上课，答题收益最高。',
                taskText: '🎓 去学校前确认饱食度，必要时先吃面包或去超市购物。',
            },
            {
                id: 'town_tip',
                label: '询问路线',
                response: '从十字路口往东南走就是学院，路边有钟楼和红砖墙，很容易认。',
                taskText: '🧭 Theo 指了路：从中心路口往东南走到阳光学院。',
            },
        ],
    },
    chenDriver: {
        id: 'chenDriver',
        name: '陈师傅',
        role: '出租车司机',
        avatar: '🚕',
        mood: '可靠',
        location: '出租车停靠点',
        greeting: '要赶时间就叫车吧。车费 5 金币，我会把你送到家、超市、市场、学校或农田附近。',
        topics: [
            {
                id: 'taxi_tip',
                label: '询问车费',
                response: '每趟 5 金币。你站在路边叫车，我会先开到最近的路口接你。',
                taskText: '🚕 可以用右下角出租车按钮快速移动，但要预留 5 金币车费。',
            },
            {
                id: 'route_tip',
                label: '推荐路线',
                response: '早上适合买种子和上课，下午去农田，晚上回家休息，节奏会更顺。',
                taskText: '🗺️ 陈师傅建议：超市买种子 → 农田种菜 → 菜市场出售 → 回家休息。',
            },
        ],
    },
    linaNeighbor: {
        id: 'linaNeighbor',
        name: 'Lina',
        role: '街角咖啡店常客',
        avatar: '☕',
        mood: '悠闲',
        location: '街角咖啡店',
        greeting: '这个小镇最舒服的时候是下午，阳光会照在咖啡店和市场摊位之间。',
        topics: [
            {
                id: 'life_tip',
                label: '聊聊生活',
                response: '别只盯着赚钱。饱食度、知识点和农田节奏都要照顾到，小镇生活才完整。',
                taskText: '☕ Lina 提醒你平衡购物、上学、种菜和休息。',
            },
            {
                id: 'home_tip',
                label: '问哪里休息',
                response: '累了就回自己的小屋睡一觉，状态会恢复得很快。',
                taskText: '🏡 如果饱食度低或天色变晚，可以回家休息。',
            },
        ],
    },
};

export const NPC_TRIGGERS = [
    { id: 'npc_maya_vendor', npcId: 'mayaVendor', x: -8.5, z: -9.5, radius: 2.6, label: 'Maya 菜市场摊主' },
    { id: 'npc_theo_student', npcId: 'theoStudent', x: 5.8, z: -10.2, radius: 2.5, label: 'Theo 阳光学院学生' },
    { id: 'npc_chen_driver', npcId: 'chenDriver', x: 10.8, z: -8.8, radius: 2.5, label: '陈师傅 出租车司机' },
    { id: 'npc_lina_neighbor', npcId: 'linaNeighbor', x: -20.5, z: -11.5, radius: 2.4, label: 'Lina 街角邻居' },
];
