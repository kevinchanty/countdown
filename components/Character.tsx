import { PIXEL } from "@/lib/pixel";

type Props = {
  name: string;
  initialFrame: string;
  charRef: (el: HTMLDivElement | null) => void;
  spriteRef: (el: HTMLDivElement | null) => void;
};

export function Character({ name, initialFrame, charRef, spriteRef }: Props) {
  return (
    <div ref={charRef} className="mario">
      <div className="char__name">{name}</div>
      <div ref={spriteRef} style={{ width: PIXEL, height: PIXEL, boxShadow: initialFrame }} />
    </div>
  );
}
