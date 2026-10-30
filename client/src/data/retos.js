/**
 * Retos de "Atrapa la alucinación".
 * La clave de corrección vive aquí, en los datos de la aplicación: ninguna
 * respuesta del modelo puede alterarla.
 *
 * Cada reto: segmentos seleccionables + errores (cada error apunta a un segmento).
 */
export const RETOS = [
  {
    id: 'r1-python-range',
    tema: 'Programación',
    titulo: 'El bucle que cuenta mal',
    nivel: 'Básico',
    pregunta: '¿Qué hace este código en Python y cuántas veces se repite el bucle?',
    codigo: 'for i in range(1, 10):\n    print(i)',
    segmentos: [
      { id: 'r1s1', texto: 'La función range(1, 10) genera una secuencia de números enteros.' },
      { id: 'r1s2', texto: 'Empieza en 1 y termina en 10, incluyendo el 10.' },
      { id: 'r1s3', texto: 'Por eso el bucle se ejecuta 10 veces.' },
      { id: 'r1s4', texto: 'En cada vuelta, la variable i toma el siguiente valor de la secuencia y print lo muestra en pantalla.' },
      { id: 'r1s5', texto: 'Si quisieras contar de dos en dos, podrías usar range(1, 10, 2).' },
      { id: 'r1s6', texto: 'Además, en Python 3 range devuelve una lista ya creada en memoria.' },
      { id: 'r1s7', texto: 'Este patrón es muy común para recorrer posiciones o repetir una acción.' },
    ],
    errores: [
      {
        id: 'r1e1',
        segmentoId: 'r1s2',
        tipo: 'Dato falso',
        explicacion: 'El límite superior de range no se incluye: range(1, 10) produce 1, 2, …, 9.',
        verificacion: 'Ejecuta list(range(1, 10)) en Python: el último valor es 9.',
      },
      {
        id: 'r1e2',
        segmentoId: 'r1s3',
        tipo: 'Conclusión derivada de un error',
        explicacion: 'Como la secuencia va de 1 a 9, el bucle se ejecuta 9 veces, no 10. Un error previo arrastró a la conclusión.',
        verificacion: 'len(range(1, 10)) devuelve 9.',
      },
      {
        id: 'r1e3',
        segmentoId: 'r1s6',
        tipo: 'Dato desactualizado',
        explicacion: 'En Python 3, range devuelve un objeto de tipo range que calcula los valores a medida que se necesitan. Era en Python 2 donde range creaba una lista.',
        verificacion: 'type(range(1, 10)) muestra <class \'range\'>, no <class \'list\'>.',
      },
    ],
    solucion:
      'range(1, 10) genera los enteros del 1 al 9 (el 10 no se incluye), así que el bucle se ejecuta 9 veces e imprime cada número. En Python 3, range devuelve un objeto range, no una lista. Para contar de dos en dos se usa range(1, 10, 2).',
  },
  {
    id: 'r2-sql-delete',
    tema: 'Bases de datos',
    titulo: 'Borrar sin mirar',
    nivel: 'Intermedio',
    pregunta: 'Explícame la diferencia entre DELETE, TRUNCATE y DROP en SQL.',
    codigo: null,
    segmentos: [
      { id: 'r2s1', texto: 'DELETE elimina filas de una tabla y permite usar WHERE para elegir cuáles borrar.' },
      { id: 'r2s2', texto: 'TRUNCATE también acepta una cláusula WHERE para eliminar solo algunas filas.' },
      { id: 'r2s3', texto: 'DROP TABLE elimina la tabla completa: su estructura y todos sus datos.' },
      { id: 'r2s4', texto: 'En general, TRUNCATE es más rápido que DELETE cuando se quiere vaciar una tabla completa.' },
      { id: 'r2s5', texto: 'Ten en cuenta que una clave primaria puede contener valores NULL si la tabla es pequeña.' },
      { id: 'r2s6', texto: 'Antes de ejecutar un DELETE sin WHERE conviene revisar dos veces, porque afecta a todas las filas.' },
    ],
    errores: [
      {
        id: 'r2e1',
        segmentoId: 'r2s2',
        tipo: 'Dato falso',
        explicacion: 'TRUNCATE vacía la tabla completa y no admite WHERE. Para borrar solo algunas filas se usa DELETE ... WHERE.',
        verificacion: 'Consulta la sintaxis de TRUNCATE TABLE en la documentación de MySQL o PostgreSQL: no tiene cláusula WHERE.',
      },
      {
        id: 'r2e2',
        segmentoId: 'r2s5',
        tipo: 'Dato inventado',
        explicacion: 'Según el estándar SQL, una clave primaria es única y NOT NULL, sin importar el tamaño de la tabla. El "si la tabla es pequeña" es una condición inventada.',
        verificacion: 'Intenta insertar una fila con la clave primaria en NULL en MySQL o PostgreSQL: el motor lo rechaza.',
      },
    ],
    solucion:
      'DELETE borra filas y admite WHERE. TRUNCATE vacía la tabla completa, no admite WHERE y suele ser más rápido. DROP TABLE elimina la tabla con su estructura. Una clave primaria nunca admite NULL según el estándar SQL.',
  },
  {
    id: 'r3-logica-implicacion',
    tema: 'Lógica',
    titulo: 'La fuente que no existe',
    nivel: 'Intermedio',
    pregunta: '¿Cuándo es verdadera la implicación p → q y con qué otras expresiones es equivalente?',
    codigo: null,
    segmentos: [
      { id: 'r3s1', texto: 'La implicación p → q solo es falsa cuando p es verdadera y q es falsa.' },
      { id: 'r3s2', texto: 'Por eso, si p es falsa, la implicación también es falsa.' },
      { id: 'r3s3', texto: 'La implicación es equivalente a ¬p ∨ q.' },
      { id: 'r3s4', texto: 'El contrarrecíproco ¬q → ¬p es lógicamente equivalente a p → q.' },
      { id: 'r3s5', texto: 'El recíproco q → p también es siempre equivalente a p → q.' },
      { id: 'r3s6', texto: 'Según el artículo de Alan Turing «Lógica Booleana Aplicada» (1962), esta tabla se estandarizó para todos los lenguajes de programación.' },
      { id: 'r3s7', texto: 'Para comprobarlo, puedes construir la tabla de verdad con las cuatro combinaciones de p y q.' },
    ],
    errores: [
      {
        id: 'r3e1',
        segmentoId: 'r3s2',
        tipo: 'Contradicción interna',
        explicacion: 'Contradice la primera frase: si p es falsa, p → q es verdadera, sin importar q.',
        verificacion: 'En la tabla de verdad, las filas con p = F dan p → q = V.',
      },
      {
        id: 'r3e2',
        segmentoId: 'r3s5',
        tipo: 'Dato falso',
        explicacion: 'El recíproco no es equivalente: con p = F y q = V, p → q es verdadera, pero q → p es falsa.',
        verificacion: 'Compara las columnas de p → q y q → p en la tabla de verdad: difieren en una fila.',
      },
      {
        id: 'r3e3',
        segmentoId: 'r3s6',
        tipo: 'Fuente inventada',
        explicacion: 'No existe registro de ese artículo, y Alan Turing murió en 1954, ocho años antes de la fecha citada. Es una alucinación típica: autor real, título y año inventados.',
        verificacion: 'Busca el título en Google Scholar o en la biblioteca: no aparece. Cualquier biografía de Turing confirma 1954.',
      },
    ],
    solucion:
      'p → q solo es falsa cuando p es V y q es F; si p es falsa, la implicación es verdadera. Es equivalente a ¬p ∨ q y a su contrarrecíproco ¬q → ¬p, pero NO a su recíproco q → p. La cita de Turing es inventada.',
  },
];
