import { COLORS, TILE } from "./config";
import { T } from "./level";

export function bakeSprite(rows: string[], palette: Record<string, string>): HTMLCanvasElement {
  const w = rows[0].length;
  const h = rows.length;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = palette[rows[y][x]];
      if (!col || col === "transparent") continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function tileCanvas(paint: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const ctx = c.getContext("2d")!;
  paint(ctx);
  return c;
}

const MARIO: Record<string, string> = {
  R: "#e52521",
  H: "#5a2d0c",
  S: "#f9b97f",
  O: "#2057d6",
  M: "#3a1d0a",
  ".": "transparent",
};
const LUIGI: Record<string, string> = { ...MARIO, R: "#22b14c" };

const BODY = [
  "...RRRRR....",
  "..RRRRRRRRR.",
  "..HHHSSMS...",
  ".HSHSSSMSS..",
  ".HSHHSSSMSSS",
  ".HHSSSSMMMM.",
  "...SSSSSSS..",
  "..RRORRR....",
  ".RRRORRORRR.",
  "RRRROOOORRRR",
  "SSRO.OO.ORSS",
  "SSSOOOOOOSSS",
];
const LEGS_STAND = ["..OO....OO..", "..HH....HH..", ".HHH....HHH."];
const LEGS_A = ["..OO....OO..", "..HH....HH..", ".HHH....HHH."];
const LEGS_B = ["..OOO..OOO..", "...HH..HH...", "..HHH..HHH.."];
const LEGS_JUMP = [".OOO....OOO.", "..HH....HH..", ".HHH....HHH."];
const DEAD = [...BODY, ...LEGS_STAND];

const GOOMBA_PAL: Record<string, string> = {
  ".": "transparent",
  K: "#000000",
  Y: "#c84c0c",
  T: "#f8d878",
  W: "#fcfcfc",
};
const GOOMBA_HEAD = [
  "....KKKKKKKK....",
  "...KYYYYYYYYK...",
  "..KYYYYYYYYYYK..",
  "..KYKKKYYKKKYK..",
  ".KYYKWWKKWWKYYK.",
  ".KYYYYYYYYYYYYK.",
  ".KKKKKKKKKKKKKK.",
  "KYYYYYKWWKYYYYYK",
  "KYYYYYYKKYYYYYYK",
  ".KYYYYYYYYYYYYK.",
  "..KKKKKKKKKKKK..",
];
const GOOMBA_A = [...GOOMBA_HEAD, "....KKK..KKK....", "...KKKK..KKKK...", "..KKKKK..KKKKK.."];
const GOOMBA_B = [...GOOMBA_HEAD, "....KKK..KKK....", "...KKK....KKK...", "..KKKK....KKKK.."];
const GOOMBA_FLAT = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....KKKKKKKK....",
  "..KYYYYYYYYYYK..",
  ".KYYKWWKKWWKYYK.",
  "KYYYYYYYYYYYYYYK",
  "KYYYYYKWWKYYYYYK",
  ".KKKKKKKKKKKKKK.",
];

const MUSH_PAL: Record<string, string> = {
  ".": "transparent",
  R: "#e52521",
  W: "#fcfcfc",
  S: "#f9b97f",
  K: "#000000",
  E: "#5a2d0c",
};
const MUSHROOM = [
  ".....KKKKKK.....",
  "...KKRRRRRRKK...",
  "..KRRWWRRRRRRK..",
  ".KRRWWWWRRRRRRK.",
  ".KRRRWWWWRRRRRK.",
  "KRRRRRWWRRRRRRRK",
  "KRRRRRRRRRRRRRRK",
  "KKKKKKKKKKKKKKKK",
  "...KEESSEESEK...",
  "..KESSSSSSSSEK..",
  "..KESSSSSSSSEK..",
  "...KKKKKKKKK....",
];

const STAR_PAL: Record<string, string> = {
  ".": "transparent",
  Y: "#fcbc3c",
  W: "#fcfcfc",
  K: "#000000",
};
const STAR = [
  ".......KK.......",
  "......KWWK......",
  "......KWWK......",
  ".....KYYYYK.....",
  "KKKKKYYYYYYKKKKK",
  ".KKYYYYYYYYYYKK.",
  "..KKYYYYYYYYKK..",
  "...KYYYYYYYYK...",
  "...KYYYKKYYYK...",
  "..KYYYK..KYYYK..",
  "..KYYK....KYYK..",
  ".KYK........KYK.",
];

const COIN_PAL: Record<string, string> = {
  ".": "transparent",
  Y: "#fcbc3c",
  D: "#ac7c00",
  W: "#fcfcfc",
  K: "#000000",
};
const COIN = [
  "..KKKK..",
  ".KYWWYK.",
  "KYWDDWYK",
  "KYDDDDYK",
  "KYDDDDYK",
  "KYWDDWYK",
  ".KYWWYK.",
  "..KKKK..",
];
const COIN_B = [
  "...KK...",
  "..KYWYK.",
  ".KYDDDYK",
  "KYDDDDYK",
  "KYDDDDYK",
  ".KYDDDYK",
  "..KYWYK.",
  "...KK...",
];
const COIN_C = [
  "........",
  "...KK...",
  "..KYWYK.",
  "..KYDYK.",
  "..KYDYK.",
  "..KYWYK.",
  "...KK...",
  "........",
];

const PEN_PAL: Record<string, string> = {
  ".": "transparent",
  K: "#000000",
  B: "#1a1a2e",
  W: "#ffffff",
  O: "#ff8c00",
  G: "#A5AAAE",
};
const PEN_A = [
  "........KKKK....",
  ".......KWWWKK...",
  ".......KWWKWKO..",
  ".......KKWWWK...",
  ".......KKKKK....",
  "......KKKGGG....",
  "......KKKKGGG...",
  ".....KKKKKGGG...",
  "...KKKKKKKGGG...",
  "....KKKKKGGGG...",
  ".....KKGGGGGG...",
  "....KKGGGGGG....",
  ".....KKGGOOOO...",
];
const PEN_B = [
  "........KKKK....",
  ".......KWWWKK...",
  ".......KWWKWKO..",
  ".......KKWWWK...",
  ".......KKKKK....",
  "......KKKGGG....",
  "......KKKKGGG...",
  ".....KKKKKGGG...",
  "...KKKKKKKGGG...",
  "....KKKKKGGGG...",
  ".....KKGGGGGG...",
  "....KKGGGGGG....",
  "...KKGGOOOO.....",
  "................",
];

const TOAD_PAL: Record<string, string> = {
  ".": "transparent",
  R: "#e52521",
  W: "#ffffff",
  T: "#f9c89b",
  K: "#000000",
  B: "#2057d6",
  N: "#8b4513",
};
const TOAD_A = [
  "....KKKKKKKK....",
  "...KWWWRRWWWK...",
  "..KRRWWRRWWRRK..",
  ".KRRWWWWWWWWRRK.",
  "KRWWWWKKKKKWWWRK",
  "KWWWKTTTTTTKWWWK",
  ".KWKTTKTTKTTKWK.",
  "..KTTTTKKTTTTK..",
  "...KTTTTTTTTK...",
  "....KKKKKKKK....",
  "..KKBBTTTTTBKK..",
  ".KTKBBBTTTBBKTK.",
  "KTTKBBBKKKBBKTTK",
  ".K.KKKKWWWKKK.K.",
  "..KWWWWWWWWWK...",
  "...KNNNKNNNK....",
  "..KNNNNKNNNNK...",
  "...KKKKKKKKK....",
];

const TOAD_B = [
  "....KKKKKKKK....",
  "...KWWWRRWWWK...",
  "..KRRWWRRWWRRK..",
  ".KRRWWWWWWWWRRK.",
  "KRWWWWKKKKKWWWRK",
  "KWWWKTTTTTTKWWWK",
  ".KWKTTKTTKTTKWK.",
  "..KTTTTKKTTTTK..",
  "...KTTTTTTTTK...",
  "....KKKKKKKK....",
  "..KKBBTTTTTBKK..",
  ".KTKBBBTTTBBKTK.",
  "KTTKBBBKKKBBKTTK",
  ".K.KKKKWWWKKK.K.",
  "..KWWWWWWWWWK...",
  ".KNNNK....KNNK..",
  "KNNNNK...KNNNNK.",
  ".KKKK.....KKKK..",
];

const KIRBY_PAL: Record<string, string> = {
  ".": "transparent",
  B: "#000000",
  P: "#ff8ab4",
  L: "#ffbada",
  D: "#d15886",
  C: "#e81e69",
  W: "#ffffff",
  E: "#231121",
  R: "#d80038",
  K: "#6c0019",
};
const KIRBY_BODY = [
  "......BBBBB.....",
  "....BBDLLLDB....",
  "...BDLLLLLLLLB..",
  "..BDLLWBLWBLLB..",
  "..BLLLWBLWBLLLB.",
  ".BLLLLLBLLBLLLB.",
  "BDLLLDDLLLDDLLB.",
  "BLLDLLLLBLLLLLB.",
  "BLLDLLLLBLLLLB..",
  ".BLLLLLLLLLLBB..",
  "..BBLLLLLLLBB...",
];
const KIRBY_A = [
  ...KIRBY_BODY,
  "...BBLLLLLBB....",
  "...BBRRRRRRKB...",
  "...BRRRRRRRRK...",
  "...BKKKKKKKKB...",
  "....BBBBBBBB....",
];
const KIRBY_B = [
  ...KIRBY_BODY,
  "...BLLLLLLBB....",
  "..BRRKB..BRRKB..",
  ".BKKKB....BKKKB.",
  "BBBB.......BBBB.",
  "................",
];

const BIGPEN_PAL: Record<string, string> = {
  ".": "transparent",
  K: "#000000",
  W: "#ffffff",
  O: "#ff8c00",
  G: "#ffffff",
};

const BB_PAL: Record<string, string> = {
  ".": "transparent",
  B: "#000000",
  G: "#4a4a4a",
  W: "#ffffff",
  E: "#000000",
  R: "#e52521",
};
const BB_MAP = [
  "......BBBBBBBBBB....",
  "....BBBBBBBWWWWWBB..",
  "..BBBBBBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBWBBBB",
  ".BBBBBGBBBBBBBWWEBBB",
  ".BBBBBGBBBBBBWWWWBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBRRWRWRWR",
  ".BBBBBGBBBBBBWRRRRRB",
  ".BBBBBGBBBBBBBRRRRRB",
  "..BBBBGBBBBBBBBWRRB.",
  "....BBGBBBBBBBBBBB..",
  "......BBBBBBBBBB....",
];

export type SpriteBank = {
  tiles: Record<number, HTMLCanvasElement>;
  questionFrames: HTMLCanvasElement[];
  coinFrames: HTMLCanvasElement[];
  fish: { stand: HTMLCanvasElement; walkA: HTMLCanvasElement; walkB: HTMLCanvasElement; jump: HTMLCanvasElement; dead: HTMLCanvasElement };
  jason: { stand: HTMLCanvasElement; walkA: HTMLCanvasElement; walkB: HTMLCanvasElement; jump: HTMLCanvasElement; dead: HTMLCanvasElement };
  goombaA: HTMLCanvasElement;
  goombaB: HTMLCanvasElement;
  goombaFlat: HTMLCanvasElement;
  mushroom: HTMLCanvasElement;
  star: HTMLCanvasElement;
  coin: HTMLCanvasElement;
  penguinA: HTMLCanvasElement;
  penguinB: HTMLCanvasElement;
  bigpenA: HTMLCanvasElement;
  bigpenB: HTMLCanvasElement;
  toadA: HTMLCanvasElement;
  toadB: HTMLCanvasElement;
  kirbyA: HTMLCanvasElement;
  kirbyB: HTMLCanvasElement;
  bullet: HTMLCanvasElement;
};

function marioSet(pal: Record<string, string>) {
  return {
    stand: bakeSprite([...BODY, ...LEGS_STAND], pal),
    walkA: bakeSprite([...BODY, ...LEGS_A], pal),
    walkB: bakeSprite([...BODY, ...LEGS_B], pal),
    jump: bakeSprite([...BODY, ...LEGS_JUMP], pal),
    dead: bakeSprite(DEAD, pal),
  };
}

function paintQuestion(ctx: CanvasRenderingContext2D, phase: number) {
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = COLORS.question;
  ctx.fillRect(1, 1, 14, 14);
  ctx.fillStyle = COLORS.questionLight;
  ctx.fillRect(1, 1, 14, 1);
  ctx.fillRect(1, 1, 1, 14);
  ctx.fillStyle = COLORS.questionDark;
  ctx.fillRect(1, 14, 14, 1);
  ctx.fillRect(14, 1, 1, 14);
  ctx.fillRect(2, 2, 2, 2);
  ctx.fillRect(12, 2, 2, 2);
  ctx.fillRect(2, 12, 2, 2);
  ctx.fillRect(12, 12, 2, 2);
  ctx.fillStyle = "#7a4a00";
  ctx.fillRect(6, 3, 4, 2);
  ctx.fillRect(10, 5, 2, 3);
  ctx.fillRect(7, 8, 3, 2);
  ctx.fillRect(7, 11, 2, 2);
  ctx.fillStyle = COLORS.questionLight;
  if (phase === 0) {
    ctx.fillRect(6, 3, 2, 1);
    ctx.fillRect(3, 1, 3, 1);
  } else if (phase === 1) {
    ctx.fillRect(10, 5, 1, 2);
    ctx.fillRect(7, 8, 2, 1);
    ctx.fillRect(7, 1, 3, 1);
  } else {
    ctx.fillRect(7, 11, 2, 1);
    ctx.fillRect(11, 1, 3, 1);
  }
}

function bakeTiles(): Record<number, HTMLCanvasElement> {
  const ground = tileCanvas((ctx) => {
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, TILE, 4);
    ctx.fillStyle = COLORS.grassLight;
    ctx.fillRect(0, 0, TILE, 1);
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(6, 3, 1, 1);
    ctx.fillRect(10, 2, 1, 1);
    ctx.fillRect(14, 3, 1, 1);
    ctx.fillStyle = COLORS.grassDark;
    ctx.fillRect(0, 4, TILE, 1);
    ctx.fillRect(4, 3, 1, 1);
    ctx.fillRect(9, 2, 1, 1);
    ctx.fillRect(13, 2, 1, 1);
    ctx.fillStyle = COLORS.groundDark;
    ctx.fillRect(2, 7, 1, 1);
    ctx.fillRect(6, 10, 1, 1);
    ctx.fillRect(11, 8, 1, 1);
    ctx.fillRect(14, 12, 1, 1);
    ctx.fillRect(4, 13, 1, 1);
    ctx.fillRect(9, 14, 1, 1);
    ctx.fillRect(0, 15, TILE, 1);
    ctx.fillStyle = COLORS.groundLight;
    ctx.fillRect(3, 6, 1, 1);
    ctx.fillRect(8, 9, 1, 1);
    ctx.fillRect(13, 11, 1, 1);
  });

  const brick = tileCanvas((ctx) => {
    ctx.fillStyle = COLORS.brick;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = COLORS.brickLine;
    ctx.fillRect(0, 0, TILE, 1);
    ctx.fillRect(0, 8, TILE, 1);
    ctx.fillStyle = COLORS.brickDark;
    ctx.fillRect(0, 7, TILE, 1);
    ctx.fillRect(0, 15, TILE, 1);
    ctx.fillRect(7, 0, 1, 8);
    ctx.fillRect(3, 8, 1, 8);
    ctx.fillRect(12, 8, 1, 8);
    ctx.fillRect(2, 3, 1, 1);
    ctx.fillRect(13, 4, 1, 1);
    ctx.fillRect(6, 11, 1, 1);
    ctx.fillRect(14, 12, 1, 1);
  });

  const question = tileCanvas((ctx) => paintQuestion(ctx, 0));

  const used = tileCanvas((ctx) => {
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = COLORS.used;
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = COLORS.groundLight;
    ctx.fillRect(1, 1, 14, 1);
    ctx.fillRect(1, 1, 1, 14);
    ctx.fillStyle = COLORS.groundDark;
    ctx.fillRect(1, 14, 14, 1);
    ctx.fillRect(14, 1, 1, 14);
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(12, 2, 2, 2);
    ctx.fillRect(2, 12, 2, 2);
    ctx.fillRect(12, 12, 2, 2);
  });

  const pipe = tileCanvas((ctx) => {
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, 1, TILE);
    ctx.fillRect(TILE - 1, 0, 1, TILE);
    ctx.fillStyle = COLORS.pipeDark;
    ctx.fillRect(1, 0, 2, TILE);
    ctx.fillRect(TILE - 4, 0, 3, TILE);
    ctx.fillStyle = COLORS.pipeLip;
    ctx.fillRect(3, 0, 3, TILE);
  });

  const pipeTop = tileCanvas((ctx) => {
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, TILE, 1);
    ctx.fillRect(0, 0, 1, 6);
    ctx.fillRect(TILE - 1, 0, 1, 6);
    ctx.fillStyle = COLORS.pipeLip;
    ctx.fillRect(1, 1, TILE - 2, 3);
    ctx.fillStyle = COLORS.pipeDark;
    ctx.fillRect(0, 5, TILE, 1);
    ctx.fillRect(1, 4, 2, 1);
    ctx.fillRect(TILE - 3, 4, 2, 1);
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 6, 1, TILE - 6);
    ctx.fillRect(TILE - 1, 6, 1, TILE - 6);
    ctx.fillStyle = COLORS.pipeDark;
    ctx.fillRect(1, 6, 2, TILE - 6);
    ctx.fillRect(TILE - 4, 6, 3, TILE - 6);
    ctx.fillStyle = COLORS.pipeLip;
    ctx.fillRect(3, 6, 3, TILE - 6);
  });

  const hard = tileCanvas((ctx) => {
    ctx.fillStyle = COLORS.hard;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = COLORS.brickLine;
    ctx.fillRect(1, 1, TILE - 2, 1);
    ctx.fillRect(1, 1, 1, TILE - 2);
    ctx.fillStyle = COLORS.hardDark;
    ctx.fillRect(0, 0, TILE, 1);
    ctx.fillRect(0, 15, TILE, 1);
    ctx.fillRect(0, 0, 1, TILE);
    ctx.fillRect(15, 0, 1, TILE);
    ctx.fillRect(1, 14, TILE - 2, 1);
    ctx.fillRect(14, 1, 1, TILE - 2);
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillRect(11, 3, 2, 2);
    ctx.fillRect(3, 11, 2, 2);
    ctx.fillRect(11, 11, 2, 2);
  });

  return {
    [T.GROUND]: ground,
    [T.BRICK]: brick,
    [T.QCOIN]: question,
    [T.QMUSH]: question,
    [T.QSTAR]: question,
    [T.USED]: used,
    [T.PIPE]: pipe,
    [T.PIPETOP]: pipeTop,
    [T.HARD]: hard,
  };
}

let bank: SpriteBank | null = null;

export function getSprites(): SpriteBank {
  if (!bank) {
    const coin = bakeSprite(COIN, COIN_PAL);
    bank = {
      tiles: bakeTiles(),
      questionFrames: [0, 1, 2].map((p) => tileCanvas((ctx) => paintQuestion(ctx, p))),
      coinFrames: [coin, bakeSprite(COIN_B, COIN_PAL), bakeSprite(COIN_C, COIN_PAL)],
      fish: marioSet(MARIO),
      jason: marioSet(LUIGI),
      goombaA: bakeSprite(GOOMBA_A, GOOMBA_PAL),
      goombaB: bakeSprite(GOOMBA_B, GOOMBA_PAL),
      goombaFlat: bakeSprite(GOOMBA_FLAT, GOOMBA_PAL),
      mushroom: bakeSprite(MUSHROOM, MUSH_PAL),
      star: bakeSprite(STAR, STAR_PAL),
      coin,
      penguinA: bakeSprite(PEN_A, PEN_PAL),
      penguinB: bakeSprite(PEN_B, PEN_PAL),
      bigpenA: bakeSprite(PEN_A, BIGPEN_PAL),
      bigpenB: bakeSprite(PEN_B, BIGPEN_PAL),
      toadA: bakeSprite(TOAD_A, TOAD_PAL),
      toadB: bakeSprite(TOAD_B, TOAD_PAL),
      kirbyA: bakeSprite(KIRBY_A, KIRBY_PAL),
      kirbyB: bakeSprite(KIRBY_B, KIRBY_PAL),
      bullet: bakeSprite(BB_MAP, BB_PAL),
    };
  }
  return bank;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  x: number,
  y: number,
  flipX = false,
  scaleX = 1,
  scaleY = 1,
) {
  const w = img.width * scaleX;
  const h = img.height * scaleY;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flipX) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
  } else {
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
  }
  ctx.restore();
}
