export interface PaipanResult {
  topic: string;
  timeStr: string;
  yueZhi: string;
  riGanZhiText: string;
  xunKong: string;
  benGuaName: string;
  bianGuaName: string;
  gongName: string;
  displayGuaText: string;
  fullMarkdown: string;
  userMessage: string;
}

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WU_XING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

interface BaguaInfo {
  name: string;
  wx: string;
  index: number;
  zhi: string[][];
}

const BAGUA_DATA: Record<string, BaguaInfo> = {
  '111': { name: '乾', wx: '金', index: 0, zhi: [['子', '寅', '辰'], ['午', '申', '戌']] },
  '110': { name: '兑', wx: '金', index: 1, zhi: [['巳', '卯', '丑'], ['亥', '酉', '未']] },
  '101': { name: '离', wx: '火', index: 2, zhi: [['卯', '丑', '亥'], ['酉', '未', '巳']] },
  '100': { name: '震', wx: '木', index: 3, zhi: [['子', '寅', '辰'], ['午', '申', '戌']] },
  '011': { name: '巽', wx: '木', index: 4, zhi: [['丑', '亥', '酉'], ['未', '巳', '卯']] },
  '010': { name: '坎', wx: '水', index: 5, zhi: [['寅', '辰', '午'], ['申', '戌', '子']] },
  '001': { name: '艮', wx: '土', index: 6, zhi: [['辰', '午', '申'], ['戌', '子', '寅']] },
  '000': { name: '坤', wx: '土', index: 7, zhi: [['未', '巳', '卯'], ['丑', '亥', '酉']] }
};

const GUA_NAME_TABLE: string[][] = [
  ['乾为天', '泽天夬', '火天大有', '雷天大壮', '风天小畜', '水天需', '山天大畜', '地天泰'],
  ['天泽履', '兑为泽', '火泽睽', '雷泽归妹', '风泽中孚', '水泽节', '山泽损', '地泽临'],
  ['天火同人', '泽火革', '离为火', '雷火丰', '风火家人', '水火既济', '山火贲', '地火明夷'],
  ['天雷无妄', '泽雷随', '火雷噬嗑', '震为雷', '风雷益', '水雷屯', '山雷颐', '地雷复'],
  ['天风姤', '泽风大过', '火风鼎', '雷风恒', '巽为风', '水风井', '山风蛊', '地风升'],
  ['天水讼', '泽水困', '火水未济', '雷水解', '风水涣', '坎为水', '山水蒙', '地水师'],
  ['天山遁', '泽山咸', '火山旅', '雷山小过', '风山渐', '水山蹇', '艮为山', '地山谦'],
  ['天地否', '泽地萃', '火地晋', '雷地豫', '风地观', '水地比', '山地剥', '坤为地']
];

const LIU_SHEN_LIST = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'];

export function getRiGanZhi(dateObj: Date) {
  let adjustedDate = new Date(dateObj.getTime());
  if (adjustedDate.getHours() >= 23) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  const baseDate = Date.UTC(2000, 0, 1);
  const targetDate = Date.UTC(adjustedDate.getFullYear(), adjustedDate.getMonth(), adjustedDate.getDate());
  const diffDays = Math.floor((targetDate - baseDate) / (24 * 3600 * 1000));
  let ganIdx = (4 + diffDays) % 10;
  let zhiIdx = (6 + diffDays) % 12;
  if (ganIdx < 0) ganIdx += 10;
  if (zhiIdx < 0) zhiIdx += 12;
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[zhiIdx], text: TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx] };
}

export function getXunKong(ganZhiStr: string): string {
  const cleanStr = ganZhiStr.replace(/日/g, "").trim();
  const xunKongMap: Record<string, string> = {
    '甲子':'戌亥', '乙丑':'戌亥', '丙寅':'戌亥', '丁卯':'戌亥', '戊辰':'戌亥', '己巳':'戌亥', '庚午':'戌亥', '辛未':'戌亥', '壬申':'戌亥', '癸酉':'戌亥',
    '甲戌':'申酉', '乙亥':'申酉', '丙子':'申酉', '丁丑':'申酉', '戊寅':'申酉', '己卯':'申酉', '庚辰':'申酉', '辛巳':'申酉', '壬午':'申酉', '癸未':'申酉',
    '甲申':'午未', '乙酉':'午未', '丙戌':'午未', '丁亥':'午未', '戊子':'午未', '己丑':'午未', '庚寅':'午未', '辛卯':'午未', '壬辰':'午未', '癸巳':'午未',
    '甲午':'辰巳', '乙未':'辰巳', '丙申':'辰巳', '丁酉':'辰巳', '戊戌':'辰巳', '己亥':'辰巳', '庚子':'辰巳', '辛丑':'辰巳', '壬寅':'辰巳', '癸卯':'辰巳',
    '甲辰':'寅卯', '乙巳':'寅卯', '丙午':'寅卯', '丁未':'寅卯', '戊申':'寅卯', '己酉':'寅卯', '庚戌':'寅卯', '辛亥':'寅卯', '壬子':'寅卯', '癸丑':'寅卯',
    '甲寅':'子丑', '乙卯':'子丑', '丙辰':'子丑', '丁巳':'子丑', '戊午':'子丑', '己未':'子丑', '庚申':'子丑', '辛酉':'子丑', '壬戌':'子丑', '癸亥':'子丑'
  };
  return xunKongMap[cleanStr] || "未知";
}

export function getYueZhi(dateObj: Date): string {
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const jieQiDays = [0, 5, 4, 5, 4, 5, 5, 7, 7, 7, 8, 7, 7];
  let adjustedMonth = month;
  if (day < jieQiDays[month]) {
    adjustedMonth = month === 1 ? 12 : month - 1;
  }
  const yueMap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
  return DI_ZHI[yueMap[adjustedMonth - 1]];
}

function getLiuQin(gongWx: string, yaoWx: string): string {
  const map: Record<string, Record<string, string>> = {
    '金': { '金': '兄弟', '木': '妻财', '水': '子孙', '火': '官鬼', '土': '父母' },
    '木': { '木': '兄弟', '土': '妻财', '火': '子孙', '金': '官鬼', '水': '父母' },
    '水': { '水': '兄弟', '火': '妻财', '木': '子孙', '土': '官鬼', '金': '父母' },
    '火': { '火': '兄弟', '金': '妻财', '土': '子孙', '水': '官鬼', '木': '父母' },
    '土': { '土': '兄弟', '水': '妻财', '金': '子孙', '木': '官鬼', '火': '父母' }
  };
  return map[gongWx]?.[yaoWx] || '未知';
}

function getLiuShenStart(riGan: string): number {
  if (['甲', '乙'].includes(riGan)) return 0;
  if (['丙', '丁'].includes(riGan)) return 1;
  if (['戊'].includes(riGan)) return 2;
  if (['己'].includes(riGan)) return 3;
  if (['庚', '辛'].includes(riGan)) return 4;
  if (['壬', '癸'].includes(riGan)) return 5;
  return 0;
}

function findGongAndShiYing(benYao: number[]) {
  const xia = benYao.slice(0, 3);
  const shang = benYao.slice(3, 6);
  let shi = 6;
  let gongBaguaKey = `${benYao[3]}${benYao[4]}${benYao[5]}`;

  if (xia.join('') === shang.join('')) {
    shi = 6;
    gongBaguaKey = shang.join('');
  } else if (benYao[0] !== benYao[3] && benYao[1] === benYao[4] && benYao[2] === benYao[5]) {
    shi = 1;
    gongBaguaKey = shang.join('');
  } else if (benYao[0] !== benYao[3] && benYao[1] !== benYao[4] && benYao[2] === benYao[5]) {
    shi = 2;
    gongBaguaKey = shang.join('');
  } else if (benYao[0] !== benYao[3] && benYao[1] !== benYao[4] && benYao[2] !== benYao[5]) {
    shi = 3;
    gongBaguaKey = shang.join('');
  } else if (benYao[0] === benYao[3] && benYao[1] !== benYao[4] && benYao[2] !== benYao[5]) {
    shi = 4;
    gongBaguaKey = xia.join('');
  } else if (benYao[0] === benYao[3] && benYao[1] === benYao[4] && benYao[2] !== benYao[5]) {
    shi = 5;
    gongBaguaKey = xia.join('');
  } else if (benYao[0] === benYao[3] && benYao[1] !== benYao[4] && benYao[2] === benYao[5]) {
    shi = 4;
    const revXia = xia.map(v => v === 1 ? 0 : 1).join('');
    gongBaguaKey = revXia;
  } else if (benYao[0] !== benYao[3] && benYao[1] === benYao[4] && benYao[2] !== benYao[5]) {
    shi = 3;
    gongBaguaKey = xia.join('');
  }

  const ying = (shi + 3) > 6 ? (shi - 3) : (shi + 3);
  const gongData = BAGUA_DATA[gongBaguaKey];

  return {
    shiPosition: shi,
    yingPosition: ying,
    gongName: gongData.name + "宫" + gongData.wx,
    gongWx: gongData.wx
  };
}

export function executePaipan(
  topic: string,
  timeStr: string,
  yueZhi: string,
  riGanZhiText: string,
  rawGua: number[]
): PaipanResult {
  const xunKong = getXunKong(riGanZhiText);
  const riGan = riGanZhiText.charAt(0);

  const yaoNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
  const symbolMap: Record<number, string> = {
    6: "▅▅ ▅▅ ✕",
    7: "▅▅▅▅▅▅ ",
    8: "▅▅ ▅▅ ",
    9: "▅▅▅▅▅▅ 〇"
  };

  const benYao = rawGua.map(v => (v === 7 || v === 9) ? 1 : 0);
  const bianYao = rawGua.map(v => (v === 9 ? 0 : (v === 6 ? 1 : (v === 7 ? 1 : 0))));

  const benXiaKey = `${benYao[0]}${benYao[1]}${benYao[2]}`;
  const benShangKey = `${benYao[3]}${benYao[4]}${benYao[5]}`;
  const benXiaGua = BAGUA_DATA[benXiaKey];
  const benShangGua = BAGUA_DATA[benShangKey];

  const gongInfo = findGongAndShiYing(benYao);
  const benGuaName = GUA_NAME_TABLE[benXiaGua.index][benShangGua.index];

  const bianXiaKey = `${bianYao[0]}${bianYao[1]}${bianYao[2]}`;
  const bianShangKey = `${bianYao[3]}${bianYao[4]}${bianYao[5]}`;
  const bianXiaGua = BAGUA_DATA[bianXiaKey];
  const bianShangGua = BAGUA_DATA[bianShangKey];
  const bianGuaName = GUA_NAME_TABLE[bianXiaGua.index][bianShangGua.index];

  const liuShenStart = getLiuShenStart(riGan);

  let displayGuaText = "六神 | 爻位 | 世应 | 本卦爻象 | 本卦纳甲 | 六亲 | 变卦/变爻\n";
  displayGuaText += "---|---|---|---|---|---|---\n";

  for (let i = 5; i >= 0; i--) {
    const isUpper = i >= 3;
    const positionIdx = isUpper ? 1 : 0;
    const subIdx = i % 3;

    const benZhi = (isUpper ? benShangGua : benXiaGua).zhi[positionIdx][subIdx];
    const benWx = WU_XING[benZhi];
    const liuQin = getLiuQin(gongInfo.gongWx, benWx);

    let shiYing = "";
    if (i + 1 === gongInfo.shiPosition) shiYing = "**[世]**";
    if (i + 1 === gongInfo.yingPosition) shiYing = "[应]";

    const liuShen = LIU_SHEN_LIST[(liuShenStart + i) % 6];

    const bianZhi = (isUpper ? bianShangGua : bianXiaGua).zhi[positionIdx][subIdx];
    const bianWx = WU_XING[bianZhi];
    const bianLiuQin = getLiuQin(gongInfo.gongWx, bianWx);

    let bianText = "";
    if (rawGua[i] === 6 || rawGua[i] === 9) {
      bianText = `变 ${bianLiuQin} ${bianZhi}${bianWx}`;
    }

    displayGuaText += `${liuShen} | ${yaoNames[i]} | ${shiYing} | ${symbolMap[rawGua[i]]} | ${benZhi}${benWx} | ${liuQin} | ${bianText}\n`;
  }

  // 排盘表格放置在顶部
  let fullMarkdown = `# ☯ 【${benGuaName}】 变 【${bianGuaName}】（${gongInfo.gongName}）\n\n`;
  fullMarkdown += `### 📋 精准六爻装卦排盘表格\n`;
  fullMarkdown += `${displayGuaText}\n`;
  fullMarkdown += `> **求占事项**：${topic}\n`;
  fullMarkdown += `> **起卦时间**：阳历 ${timeStr}\n`;
  fullMarkdown += `> **干支历法**：${yueZhi}月 ${riGanZhiText}日 （旬空：${xunKong}）\n\n`;
  fullMarkdown += `---\n\n`;
  fullMarkdown += `### 📜 古筮经典理气剖析（《增删卜易》《卜筮正宗》《古筮真诠》）\n`;
  fullMarkdown += `> 正在调用 AI 依据古筮三大经典进行综合理气解卦中，请稍候...\n`;

  const userMessage = `求占事项：${topic}\n月建：${yueZhi}月\n日柱：${riGanZhiText}（旬空：${xunKong}）\n卦名：本卦【${benGuaName}】 变 【${bianGuaName}】（属于 ${gongInfo.gongName}）\n【结构化排盘数据】:\n${displayGuaText}\n请结合《增删卜易》、《卜筮正宗》及《古筮真诠》的理论体系，对本卦进行深度理气拆解与学术教学讲析。`;

  return {
    topic,
    timeStr,
    yueZhi,
    riGanZhiText,
    xunKong,
    benGuaName,
    bianGuaName,
    gongName: gongInfo.gongName,
    displayGuaText,
    fullMarkdown,
    userMessage
  };
}
