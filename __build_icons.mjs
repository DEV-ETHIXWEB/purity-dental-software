import { readFileSync, writeFileSync } from "fs";

const DIR = "figma/Purity Research";

// name -> [outlineGroupNum, filledGroupNum]
const PAIRS = {
  Tooth: [931, 932],
  Crown: [933, 934],
  ClockSlot: [935, 936],
  Signature: [937, 938],
  Person: [939, 940],
  Swap: [941, 942],
  Notification: [943, 944],
  Dollar: [945, 946],
  RootCanal: [947, 948],
  Calendar: [949, 950],
  Document: [951, 952],
  Checklist: [953, 954],
  Doctor: [955, 956],
  Chat: [957, 958],
  Billing: [959, 960],
  CreditCard: [961, 962],
};

function transform(svgText, componentName) {
  const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch[1];

  // Find every unique gradient id referenced, in order of appearance.
  const ids = [...new Set([...svgText.matchAll(/id="(paint\d+_linear_[^"]+)"/g)].map((m) => m[1]))];

  let body = svgText
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();

  ids.forEach((id, i) => {
    const re = new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    body = body.replace(re, `\${uid}-${i}`);
  });

  body = body.replace(/stop-color="([^"]+)"/g, 'stopColor="$1"');

  // `${uid}` only interpolates inside a JSX expression container — left in a
  // plain string attribute it emits the literal text "${uid}-0", so every
  // icon in the app would share one gradient id and `useId()` would be inert.
  // Promote any attribute carrying the placeholder to {`...`}.
  body = body.replace(
    /([a-zA-Z-]+)="([^"]*\$\{uid\}[^"]*)"/g,
    (_match, attr, value) => `${attr}={\`${value}\`}`,
  );

  return { viewBox, body };
}

let out = `import { useId } from "react";

export interface PurityIconProps {
  className?: string;
}

`;

for (const [name, [outlineNum, filledNum]] of Object.entries(PAIRS)) {
  const outlineSvg = readFileSync(`${DIR}/Group 1000000${outlineNum}.svg`, "utf8");
  const filledSvg = readFileSync(`${DIR}/Group 1000000${filledNum}.svg`, "utf8");

  const outline = transform(outlineSvg, `${name}Icon`);
  const filled = transform(filledSvg, `${name}IconFilled`);

  out += `export function ${name}Icon({ className }: PurityIconProps) {
  const uid = useId();
  return (
    <svg viewBox="${outline.viewBox}" fill="none" className={className} aria-hidden="true">
      ${outline.body}
    </svg>
  );
}

export function ${name}IconFilled({ className }: PurityIconProps) {
  const uid = useId();
  return (
    <svg viewBox="${filled.viewBox}" fill="none" className={className} aria-hidden="true">
      ${filled.body}
    </svg>
  );
}

`;
}

writeFileSync("src/components/ui/icons/purity-icons.tsx", out);
console.log("wrote", Object.keys(PAIRS).length * 2, "components");
