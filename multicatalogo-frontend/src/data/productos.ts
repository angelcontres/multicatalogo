// src/data/productos.ts
// Datos de ejemplo (mock) del catálogo.
// En la Unidad 2 estos datos se conectan con los registros reales de PostgreSQL.

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  img: string;        // Imagen principal (portada)
  galeria: string[];  // Imágenes adicionales para la galería/lightbox
}

// Lista de categorías derivada de los productos (se usa para los filtros)
export const categorias = [
  "Serum",
  "Crema",
  "Tónico",
  "Mascarilla",
  "Kit",
  "Protector",
  "Limpiador",
  "Aceite",
];

export const productosMock: Producto[] = [
  {
    id: 1,
    nombre: "Serum Revitalizante",
    descripcion:
      "Serum concentrado con vitamina C y ácido hialurónico. Ilumina la piel, reduce manchas y aporta hidratación profunda desde la primera aplicación.",
    precio: 45.0,
    categoria: "Serum",
    img: "https://picsum.photos/seed/serum/600",
    galeria: [
      "https://picsum.photos/seed/serum1/600",
      "https://picsum.photos/seed/serum2/600",
      "https://picsum.photos/seed/serum3/600",
    ],
  },
  {
    id: 2,
    nombre: "Crema Hidratante Pro",
    descripcion:
      "Crema facial de textura ligera con niacinamida y manteca de karité. Hidratación de 24 horas y barrera cutánea fortalecida para todo tipo de piel.",
    precio: 32.5,
    categoria: "Crema",
    img: "https://picsum.photos/seed/crema/600",
    galeria: [
      "https://picsum.photos/seed/crema1/600",
      "https://picsum.photos/seed/crema2/600",
      "https://picsum.photos/seed/crema3/600",
    ],
  },
  {
    id: 3,
    nombre: "Tónico Purificante",
    descripcion:
      "Tónico sin alcohol con hamamelis y agua de rosas. Limpia poros, equilibra el pH y prepara la piel para el resto de la rutina diaria.",
    precio: 28.0,
    categoria: "Tónico",
    img: "https://picsum.photos/seed/tonico/600",
    galeria: [
      "https://picsum.photos/seed/tonico1/600",
      "https://picsum.photos/seed/tonico2/600",
      "https://picsum.photos/seed/tonico3/600",
    ],
  },
  {
    id: 4,
    nombre: "Mascarilla Nocturna",
    descripcion:
      "Mascarilla de noche con colágeno y vitamina E. Repara la piel mientras duermes y recupera la luminosidad al despertar.",
    precio: 50.0,
    categoria: "Mascarilla",
    img: "https://picsum.photos/seed/mascarilla/600",
    galeria: [
      "https://picsum.photos/seed/mascarilla1/600",
      "https://picsum.photos/seed/mascarilla2/600",
      "https://picsum.photos/seed/mascarilla3/600",
    ],
  },
  {
    id: 5,
    nombre: "Serum Anti-Edad Retinol",
    descripcion:
      "Serum de retinol encapsulado que suaviza líneas de expresión y mejora la firmeza. Uso nocturno recomendado.",
    precio: 58.0,
    categoria: "Serum",
    img: "https://picsum.photos/seed/retinol/600",
    galeria: [
      "https://picsum.photos/seed/retinol1/600",
      "https://picsum.photos/seed/retinol2/600",
      "https://picsum.photos/seed/retinol3/600",
    ],
  },
  {
    id: 6,
    nombre: "Crema Contorno de Ojos",
    descripcion:
      "Contorno de ojos con cafeína y péptidos. Reduce bolsas y ojeras, hidrata la zona más delicada del rostro.",
    precio: 26.0,
    categoria: "Crema",
    img: "https://picsum.photos/seed/ojos/600",
    galeria: [
      "https://picsum.photos/seed/ojos1/600",
      "https://picsum.photos/seed/ojos2/600",
      "https://picsum.photos/seed/ojos3/600",
    ],
  },
  {
    id: 7,
    nombre: "Tónico Exfoliante AHA-BHA",
    descripcion:
      "Exfoliación química suave con ácidos AHA y BHA. Renueva la textura de la piel y desobstruye los poros.",
    precio: 34.0,
    categoria: "Tónico",
    img: "https://picsum.photos/seed/exfoliante/600",
    galeria: [
      "https://picsum.photos/seed/exfoliante1/600",
      "https://picsum.photos/seed/exfoliante2/600",
      "https://picsum.photos/seed/exfoliante3/600",
    ],
  },
  {
    id: 8,
    nombre: "Kit Rutina Completa",
    descripcion:
      "Kit integral con serum, crema, tónico y mascarilla. La rutina perfecta para comenzar: limpieza, tratamiento e hidratación.",
    precio: 129.0,
    categoria: "Kit",
    img: "https://picsum.photos/seed/kit/600",
    galeria: [
      "https://picsum.photos/seed/kit1/600",
      "https://picsum.photos/seed/kit2/600",
      "https://picsum.photos/seed/kit3/600",
    ],
  },
  {
    id: 9,
    nombre: "Protector Solar Facial SPF 50+",
    descripcion:
      "Fluido solar invisible no comedogénico con filtros minerales y toque seco mate. Protección UVA/UVB de amplio espectro.",
    precio: 36.0,
    categoria: "Protector",
    img: "https://picsum.photos/seed/solar/600",
    galeria: [
      "https://picsum.photos/seed/solar1/600",
      "https://picsum.photos/seed/solar2/600",
    ],
  },
  {
    id: 10,
    nombre: "Gel Limpiador Espumoso",
    descripcion:
      "Limpiador facial suave con pH 5.5, ceramidas esenciales y extracto calmante de manzanilla. Remueve impurezas sin resecar.",
    precio: 24.0,
    categoria: "Limpiador",
    img: "https://picsum.photos/seed/cleanser/600",
    galeria: [
      "https://picsum.photos/seed/cleanser1/600",
      "https://picsum.photos/seed/cleanser2/600",
    ],
  },
  {
    id: 11,
    nombre: "Aceite Facial de Escualano",
    descripcion:
      "Aceite vegetal 100% puro derivado de caña de azúcar que sella la humedad e incrementa la elasticidad sin efecto graso.",
    precio: 48.0,
    categoria: "Aceite",
    img: "https://picsum.photos/seed/oil/600",
    galeria: [
      "https://picsum.photos/seed/oil1/600",
      "https://picsum.photos/seed/oil2/600",
    ],
  },
  {
    id: 12,
    nombre: "Mascarilla de Arcilla Rosa",
    descripcion:
      "Mascarilla purificante desintoxicante con arcilla rosa francesa y extracto de aloe vera. Reduce poros y absorbe impurezas.",
    precio: 38.5,
    categoria: "Mascarilla",
    img: "https://picsum.photos/seed/clay/600",
    galeria: [
      "https://picsum.photos/seed/clay1/600",
      "https://picsum.photos/seed/clay2/600",
    ],
  },
  {
    id: 13,
    nombre: "Serum Niacinamida 10% + Zinc",
    descripcion:
      "Tratamiento intensivo para minimizar poros visibles, reducir manchas y regular el exceso de producción sebácea.",
    precio: 42.0,
    categoria: "Serum",
    img: "https://picsum.photos/seed/niacinamide/600",
    galeria: [
      "https://picsum.photos/seed/niacinamide1/600",
      "https://picsum.photos/seed/niacinamide2/600",
    ],
  },
  {
    id: 14,
    nombre: "Bálsamo Labial con Péptidos",
    descripcion:
      "Bálsamo labial ultra-hidratante enriquecido con manteca de cacao pura y péptidos voluminizadores para labios suaves.",
    precio: 18.0,
    categoria: "Crema",
    img: "https://picsum.photos/seed/lip/600",
    galeria: [
      "https://picsum.photos/seed/lip1/600",
      "https://picsum.photos/seed/lip2/600",
    ],
  },
  {
    id: 15,
    nombre: "Agua Micelar Calmante",
    descripcion:
      "Agua micelar desmaquillante bifásica enriquecida con centella asiática, ideal para calmar pieles sensibles y reactivas.",
    precio: 22.0,
    categoria: "Limpiador",
    img: "https://picsum.photos/seed/micellar/600",
    galeria: [
      "https://picsum.photos/seed/micellar1/600",
      "https://picsum.photos/seed/micellar2/600",
    ],
  },
  {
    id: 16,
    nombre: "Bruma Hidratante Poliglutámica",
    descripcion:
      "Spray facial refrescante ultraligero que retiene la hidratación hasta 4 veces más que el ácido hialurónico tradicional.",
    precio: 30.0,
    categoria: "Tónico",
    img: "https://picsum.photos/seed/mist/600",
    galeria: [
      "https://picsum.photos/seed/mist1/600",
      "https://picsum.photos/seed/mist2/600",
    ],
  },
  {
    id: 17,
    nombre: "Fluido Matificante Mat-Pro",
    descripcion:
      "Emulsión facial ultraligera reguladora formulada con extracto de bambú para mantener la piel suave y mate todo el día.",
    precio: 35.0,
    categoria: "Crema",
    img: "https://picsum.photos/seed/matt/600",
    galeria: [
      "https://picsum.photos/seed/matt1/600",
      "https://picsum.photos/seed/matt2/600",
    ],
  },
  {
    id: 18,
    nombre: "Kit Glow Intensivo",
    descripcion:
      "Dúo luminoso de choque: serum de vitamina C activa y mascarilla de arcilla rosa francesa para un rostro radiante.",
    precio: 78.0,
    categoria: "Kit",
    img: "https://picsum.photos/seed/glowkit/600",
    galeria: [
      "https://picsum.photos/seed/glowkit1/600",
      "https://picsum.photos/seed/glowkit2/600",
    ],
  },
];
