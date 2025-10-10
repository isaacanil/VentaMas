import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal } from "antd";

import { generativeModel } from "../../../../../../../firebase/firebaseconfig";

export function applyCorrections(original, correctionsText) {
    let updated = original;
    let pairs = [];

    // 1) XY → ZW
    correctionsText.split("\n").forEach(line => {
        if (line.includes("→")) {
            const [w, r] = line.split("→").map(s => s.replace(/["*–]/g, "").trim());
            pairs.push({ wrong: w, right: r });
        }
    });

    // 2) Si es JSON array
    if (pairs.length === 0 && correctionsText.trim().startsWith("[")) {
        try {
            const arr = JSON.parse(correctionsText);
            // array de objetos {wrong,right}?
            if (arr.every(it => it.wrong && it.right)) {
                pairs = arr;
            }
            // array de strings → asumimos que el string es la forma correcta y buscamos cuál era incorrecta...
            else if (arr.every(it => typeof it === "string")) {
                arr.forEach(right => {
                    // intenta encontrar en original la palabra más parecida
                    // aquí podrías usar un simple includes o Levenshtein
                    pairs.push({ wrong: right, right });
                });
            }
        } catch { }
    }

    // 3) Viñetas sin flecha: * palabra_correcta
    if (pairs.length === 0) {
        correctionsText.split("\n")
            .filter(l => l.trim().startsWith("*"))
            .forEach(l => {
                const right = l.replace("*", "").trim();
                // de nuevo, buscar en original la forma errónea o simplemente reemplazar
                pairs.push({ wrong: right, right });
            });
    }

    // Aplica
    pairs.forEach(({ wrong, right }) => {
        const re = new RegExp(`\\b${wrong}\\b`, "g");
        updated = updated.replace(re, right);
    });

    return updated;
}

export function extractJson(raw) {
  // Si viene rodeado de ```json ... ``` o ``` ... ```
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();   // contenido interno
  return raw.trim();                   // tal cual
}

export function buildSpellcheckPrompt(text) {
  return `Detecta errores ortográficos en el siguiente texto y devuélvelos
EXCLUSIVAMENTE en JSON:
[
  { "wrong": "palabra_mal", "right": "palabra_bien" }
]
Si no hay errores, devuelve [].

Texto:
${text}`;
}

export function parseCorrections(rawText) {
  const clean = extractJson(rawText);
  // intenta JSON first
  try {
    const arr = JSON.parse(clean);
    if (Array.isArray(arr) && arr.every(it => it.wrong && it.right)) {
      return arr;
    }
  } catch {}
  // fallback: extrae pares con la lógica de applyCorrections
  // pero sólo devolviendo los pares, no aplicándolos
  let pairs = [];
  rawText.split("\n").forEach(line => {
    if (line.includes("→")) {
      const [w, r] = line.split("→").map(s => s.replace(/["*–]/g, "").trim());
      pairs.push({ wrong: w, right: r });
    }
  });
  return pairs;
}

export async function fetchCorrections(text) {
  const prompt = buildSpellcheckPrompt(text);
  const { response } = await generativeModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });
  return response.candidates[0].content.parts[0].text;
}

export function renderCorrectionsList(pairs, rawText) {
  if (pairs.length === 0) {
    return <p>No se encontraron errores ortográficos.</p>;
  }
  return (
    <ul style={{ paddingLeft: 20, margin: 0 }}>
      {pairs.map(({ wrong, right }, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          <strong style={{ color: '#d32f2f' }}>{wrong}</strong> →{' '}
          <em style={{ color: '#388e3c' }}>{right}</em>
        </li>
      ))}
    </ul>
  );
}

export function showCorrectionsModal(rawText, pairs, original, onApply) {
  Modal.confirm({
    title: "Correcciones ortográficas encontradas",
    icon: <ExclamationCircleOutlined />,
    content: (
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {renderCorrectionsList(pairs, rawText)}
      </div>
    ),
    okText: "Aplicar correcciones",
    cancelText: "Cancelar",
    onOk() {
      const updated = pairs.length
        ? pairs.reduce(
            (acc, { wrong, right }) =>
              acc.replace(new RegExp(`\\b${wrong}\\b`, "gi"), right),
            original
          )
        : applyCorrections(original, rawText);
      onApply(updated);
    }
  });
}