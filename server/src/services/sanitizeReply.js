/**
 * Limpia razonamiento interno que gpt-oss a veces filtra dentro de message.content
 * (además del campo message.thinking, que ya se descarta).
 *
 * Casos que cubre:
 *  1. Marcadores del formato "harmony" de gpt-oss: "...analysis ... assistantfinal <respuesta>".
 *  2. Frases de planificación en inglés al INICIO de la respuesta, por ejemplo:
 *     "We should respond with brief. Ask a question.En `range(1, 10)` ¿qué valores…"
 *
 * Es conservador: solo elimina frases iniciales que parecen notas en inglés y nunca
 * toca texto en español. Si no queda nada, devuelve '' para que el backend lo trate
 * como respuesta vacía en lugar de mostrar el razonamiento.
 */

const META_START =
  /^(?:we|the user|user|they|let'?s|let us|i|i'?ll|i'?m|so|now|thus|therefore|ok(?:ay)?,? (?:so|we|let'?s)|need|must|should|probably|maybe|the answer|the question|this is|ask|answer|respond|provide|give|use|keep|explain|avoid|don'?t|do not|make sure|ensure|also|then|first|next|finally|it'?s|that'?s|here)\b/i;

const SPANISH_HINT = /[¿¡ñáéíóúü]|\b(?:el|la|los|las|que|qué|una|un|es|para|por|con|del|tu|tú)\b/i;

function looksLikeEnglishMeta(sentence) {
  const s = sentence.trim();
  if (!s) return false;
  if (SPANISH_HINT.test(s)) return false;
  return META_START.test(s);
}

export function sanitizeReply(raw) {
  if (typeof raw !== 'string') return '';
  let text = raw;

  // 1. Formato harmony: quedarse con lo que va después del último marcador final.
  const finalMarker = /(?:<\|channel\|>\s*final\s*<\|message\|>|assistantfinal)/gi;
  let lastIndex = -1;
  let m;
  while ((m = finalMarker.exec(text))) lastIndex = m.index + m[0].length;
  if (lastIndex >= 0) text = text.slice(lastIndex);
  text = text.replace(/<\|[^|>]+\|>/g, '');

  // 2. Quitar frases iniciales de planificación en inglés.
  text = text.trimStart();
  for (let i = 0; i < 8; i += 1) {
    const sentence = text.match(/^[^\n.!?:]*[.!?:]+[ \t]*|^[^\n]*\n/);
    if (!sentence || !looksLikeEnglishMeta(sentence[0])) break;
    text = text.slice(sentence[0].length).trimStart();
  }

  return text.trim();
}
