/**
 * Autodiagnóstico: 5 preguntas de conocimiento con respuesta verificable,
 * más 3 afirmaciones OPCIONALES de autorreflexión sobre hábitos de uso de la IA.
 * El conocimiento y los hábitos se califican por separado.
 */

export const TEMAS = {
  'Programación y lógica': {
    recomendacion:
      'Repasa división entera y equivalencias lógicas construyendo tablas de verdad a mano y ejecutando ejemplos pequeños en Python.',
  },
  'Bases de datos': {
    recomendacion: 'Practica consultas con GROUP BY y HAVING sobre una tabla de ejemplo y compara los resultados con y sin HAVING.',
  },
  'Uso crítico de la IA': {
    recomendacion:
      'Antes de usar un dato de la IA, búscalo en una fuente original (documentación oficial, libro, base académica) y revisa el acuerdo de uso de IA de cada materia.',
  },
};

export const PREGUNTAS = [
  {
    id: 'q1',
    tema: 'Programación y lógica',
    enunciado: '¿Qué valor guarda x después de ejecutar x = 7 // 2 en Python 3?',
    opciones: [
      { id: 'a', texto: '3.5' },
      { id: 'b', texto: '3' },
      { id: 'c', texto: '4' },
      { id: 'd', texto: '3.0' },
    ],
    correcta: 'b',
    explicacion: 'El operador // hace división entera (piso). Con dos enteros el resultado es el entero 3.',
  },
  {
    id: 'q2',
    tema: 'Bases de datos',
    enunciado: '¿Qué cláusula de SQL filtra los grupos después de un GROUP BY?',
    opciones: [
      { id: 'a', texto: 'WHERE' },
      { id: 'b', texto: 'ORDER BY' },
      { id: 'c', texto: 'HAVING' },
      { id: 'd', texto: 'LIMIT' },
    ],
    correcta: 'c',
    explicacion: 'WHERE filtra filas antes de agrupar; HAVING filtra los grupos ya formados, por ejemplo HAVING COUNT(*) > 3.',
  },
  {
    id: 'q3',
    tema: 'Programación y lógica',
    enunciado: '¿Cuál de estas expresiones es lógicamente equivalente a p → q?',
    opciones: [
      { id: 'a', texto: 'q → p' },
      { id: 'b', texto: '¬p → ¬q' },
      { id: 'c', texto: '¬q → ¬p' },
      { id: 'd', texto: 'p ∧ q' },
    ],
    correcta: 'c',
    explicacion: 'El contrarrecíproco ¬q → ¬p es equivalente. El recíproco (q → p) y el inverso (¬p → ¬q) no lo son.',
  },
  {
    id: 'q4',
    tema: 'Uso crítico de la IA',
    enunciado:
      'Un chatbot te da una cita textual con autor, libro, año y página para tu informe. ¿Qué es lo más adecuado?',
    opciones: [
      { id: 'a', texto: 'Usarla, porque tiene todos los datos de una referencia.' },
      { id: 'b', texto: 'Buscar la fuente original y confirmar que existe y dice eso.' },
      { id: 'c', texto: 'Pedirle al mismo chatbot que confirme si la cita es real.' },
      { id: 'd', texto: 'Cambiar algunas palabras para que no parezca copiada.' },
    ],
    correcta: 'b',
    explicacion:
      'Los modelos pueden inventar referencias con formato perfecto. Preguntarle al mismo modelo no es verificar: hay que ir a la fuente original.',
  },
  {
    id: 'q5',
    tema: 'Uso crítico de la IA',
    enunciado:
      'Tu profesor permite usar IA para entender conceptos, pero no para redactar el informe. ¿Qué uso respeta ese acuerdo?',
    opciones: [
      { id: 'a', texto: 'Pedirle a la IA el informe y entregarlo con tu nombre.' },
      { id: 'b', texto: 'Pedirle a la IA que redacte solo la introducción y las conclusiones.' },
      { id: 'c', texto: 'Pedirle que te explique un concepto y luego redactar con tus palabras.' },
      { id: 'd', texto: 'Traducir un informe hecho por IA desde otro idioma.' },
    ],
    correcta: 'c',
    explicacion: 'El acuerdo permite usar la IA para comprender. La redacción debe ser tuya, aunque te apoyes en lo que entendiste.',
  },
];

export const NIVELES_CONFIANZA = [
  { id: 'baja', texto: 'Adiviné' },
  { id: 'media', texto: 'Dudo' },
  { id: 'alta', texto: 'Seguro' },
];

/** Autorreflexión opcional (autodeclarada). Valores: 0 = Nunca, 1 = A veces, 2 = Casi siempre. */
export const HABITOS = [
  { id: 'h1', texto: 'Cuando tengo un taller, lo primero que hago es pedirle la respuesta a una IA.' },
  { id: 'h2', texto: 'Entrego respuestas generadas por IA sin verificar si son correctas.' },
  { id: 'h3', texto: 'Me costaría explicar sin ayuda lo que entregué en mi último taller.' },
];

export const ESCALA_HABITOS = [
  { valor: 0, texto: 'Nunca' },
  { valor: 1, texto: 'A veces' },
  { valor: 2, texto: 'Casi siempre' },
];
