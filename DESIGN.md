# Design Brief

## Direction

Cancha de Barrio — un cuaderno de club bien cuidado: verde cancha profundo, tipografía grande y con carácter, y superficies cálidas que se leen sin esfuerzo a los 70 años.

## Tone

Cálido y confiable, no infantil: la energía viene del verde y el naranja pelota, la calma viene de la tipografía grande y el espacio generoso.

## Differentiation

La textura de líneas de césped (`bg-pitch-texture`) usada como franja decorativa en encabezados y separadores: da identidad de cancha sin una sola imagen.

## Color Palette

| Token      | OKLCH         | Role   |
| ---------- | ------------- | ------ |
| background | 0.975 0.012 145 | Fondo verde tiza cálido, nunca blanco puro |
| foreground | 0.21 0.03 150  | Texto principal, casi negro con tinte verde |
| card       | 0.995 0.006 145 | Tarjetas de partido y fichas de jugador |
| primary    | 0.43 0.115 152 | Verde cancha: botones principales, encabezado |
| accent     | 0.66 0.175 47  | Naranja pelota: cupos, estados activos, resaltados |
| muted      | 0.94 0.016 145 | Franjas alternas y fondos secundarios |

## Typography

- Display: Bricolage Grotesque — títulos de página, nombres de partido, marcadores
- Body: Figtree — párrafos, etiquetas de formulario, listas (base 18px, interlineado 1.65)
- Mono: JetBrains Mono — números de teléfono, fecha/hora, marcadores
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl`, label `text-sm font-semibold tracking-widest uppercase`, body `text-lg md:text-xl leading-relaxed`

## Elevation & Depth

Jerarquía por capas planas: fondo verde tiza, tarjetas casi blancas con borde visible y sombra suave; solo el elemento activo (próximo partido, modal) sube a `shadow-float`.

## Structural Zones

| Zone    | Background            | Border            | Notes                                                        |
| ------- | --------------------- | ----------------- | ------------------------------------------------------------ |
| Header  | `bg-card`             | `border-b-2`      | Barra sticky, logo + navegación con texto grande, activo en `text-primary` |
| Content | `bg-background`       | —                 | Franjas alternas `bg-muted/40`; cada sección con encabezado grande y acción a la derecha |
| Footer  | `bg-muted/60`         | `border-t-2`      | Datos del grupo en texto grande, sin enlaces pequeños         |

## Spacing & Rhythm

Secciones `py-12 md:py-16`, grupos internos `space-y-6`, tarjetas `p-6 md:p-8`; densidad baja a propósito para que cada dato respire.

## Component Patterns

- Buttons: alto mínimo 48px, radio 12px, primario verde sólido, secundario borde 2px; hover oscurece y eleva 1px, nunca cambia de color
- Cards: radio 16px, `bg-card`, borde 1px `border-border`, `shadow-subtle`; al hover `shadow-elevated` y borde `border-primary/40`
- Badges: píldora `rounded-full`, cupos en `bg-accent/15 text-accent-foreground` con borde `accent/40`, confirmado en verde, rechazado en `destructive`

## Motion

- Entrance: `animate-fade-up` escalonado (0.45s) en listas de partidos y plantel
- Hover: `transition-smooth` 0.3s en botones, tarjetas y filas; elevación sutil, sin rebotes
- Decorative: `animate-pulse-soft` solo en el indicador de cupos restantes; nada más se mueve

## Constraints

- Contraste AA+ obligatorio en ambos modos; nunca texto gris claro sobre verde
- Área táctil mínima 48×48px y foco visible de 3px en todo elemento interactivo
- Toda la interfaz en español, con etiquetas explícitas (nada de solo iconos)
- Sin texto decorativo bajo 16px; sin animaciones que superen 0.5s ni movimiento continuo salvo el indicador de cupos
- Paleta limitada a verde, naranja, neutros cálidos y rojo de error

## Signature Detail

La franja de césped rayado (`bg-pitch-texture`) como firma visual: textura tipográfica-material que convierte cada encabezado en una línea de cancha.
