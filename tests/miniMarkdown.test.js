import { describe, it, expect } from 'vitest';
import { escaparHtml, renderizarApunte, alternarMarca, anteponerEnLinea, contarPalabras } from '../src/lib/miniMarkdown.js';

describe('formato de apuntes', () => {
  it('escapa HTML para que sea seguro de mostrar', () => {
    expect(escaparHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('renderiza negrita, cursiva y código en línea', () => {
    expect(renderizarApunte('Esto es **importante** y *sutil* y `código`.')).toContain('<b>importante</b>');
    expect(renderizarApunte('*sutil*')).toContain('<i>sutil</i>');
    expect(renderizarApunte('`código`')).toContain('<code>código</code>');
  });
  it('nunca ejecuta HTML que el usuario haya escrito', () => {
    const html = renderizarApunte('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
  it('convierte títulos y listas', () => {
    const html = renderizarApunte('# Título\n## Subtítulo\n- uno\n- dos\n1. primero\n2. segundo');
    expect(html).toContain('<h1>Título</h1>');
    expect(html).toContain('<h2>Subtítulo</h2>');
    expect(html).toContain('<ul><li>uno</li><li>dos</li></ul>');
    expect(html).toContain('<ol><li>primero</li><li>segundo</li></ol>');
  });
  it('alterna una marca (negrita) sobre el texto seleccionado', () => {
    const r = alternarMarca('hola mundo', 5, 10, '**');
    expect(r.texto).toBe('hola **mundo**');
    const r2 = alternarMarca(r.texto, r.inicio, r.fin, '**');
    expect(r2.texto).toBe('hola mundo');
  });
  it('antepone y quita un prefijo de lista en la línea del cursor', () => {
    const r = anteponerEnLinea('primera\nsegunda', 10, '- ');
    expect(r.texto).toBe('primera\n- segunda');
    const r2 = anteponerEnLinea(r.texto, r.cursor, '- ');
    expect(r2.texto).toBe('primera\nsegunda');
  });
  it('cuenta palabras', () => {
    expect(contarPalabras('  hola   mundo cruel  ')).toBe(3);
    expect(contarPalabras('')).toBe(0);
  });
});
