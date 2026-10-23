// repository/repository.go
package repository

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"sync"

	"github.com/jackc/pgx/v5"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
)

var (
	memMutex sync.RWMutex

	// Semillas en memoria para degradación elegante cuando PostgreSQL no esté en línea
	memUsuarios = []models.Usuario{
		{ID: 1, Email: "admin@upse.edu.ec", Password: "admin", Nombre: "Administrador General", Rol: "admin", Activo: true},
		{ID: 2, Email: "cliente@upse.edu.ec", Password: "user", Nombre: "Luis Poveda", Rol: "cliente", Activo: true},
		{ID: 3, Email: "ana@upse.edu.ec", Password: "user", Nombre: "Ana García", Rol: "cliente", Activo: true},
		{ID: 4, Email: "marta@upse.edu.ec", Password: "user", Nombre: "Marta Sánchez", Rol: "cliente", Activo: true},
		{ID: 5, Email: "carlos@upse.edu.ec", Password: "user", Nombre: "Carlos Ruiz", Rol: "cliente", Activo: true},
		{ID: 6, Email: "valeria@upse.edu.ec", Password: "user", Nombre: "Valeria Castro", Rol: "cliente", Activo: true},
	}

	memProductos = []models.Producto{
		{ID: 1, Nombre: "Serum Revitalizante", Descripcion: "Serum concentrado con vitamina C y ácido hialurónico.", Precio: 45.00, Stock: 15, Categoria: "Serum", Img: "https://picsum.photos/seed/serum/600", Galeria: []string{"https://picsum.photos/seed/serum1/600", "https://picsum.photos/seed/serum2/600"}, Activo: true},
		{ID: 2, Nombre: "Crema Hidratante Pro", Descripcion: "Crema facial de textura ligera con niacinamida y manteca de karité.", Precio: 32.50, Stock: 20, Categoria: "Crema", Img: "https://picsum.photos/seed/crema/600", Galeria: []string{"https://picsum.photos/seed/crema1/600", "https://picsum.photos/seed/crema2/600"}, Activo: true},
		{ID: 3, Nombre: "Tónico Purificante", Descripcion: "Tónico sin alcohol con hamamelis y agua de rosas.", Precio: 28.00, Stock: 25, Categoria: "Tónico", Img: "https://picsum.photos/seed/tonico/600", Galeria: []string{"https://picsum.photos/seed/tonico1/600", "https://picsum.photos/seed/tonico2/600"}, Activo: true},
		{ID: 4, Nombre: "Mascarilla Nocturna", Descripcion: "Mascarilla de noche con colágeno y vitamina E.", Precio: 50.00, Stock: 12, Categoria: "Mascarilla", Img: "https://picsum.photos/seed/mascarilla/600", Galeria: []string{"https://picsum.photos/seed/mascarilla1/600", "https://picsum.photos/seed/mascarilla2/600"}, Activo: true},
		{ID: 5, Nombre: "Serum Anti-Edad Retinol", Descripcion: "Serum de retinol encapsulado.", Precio: 58.00, Stock: 10, Categoria: "Serum", Img: "https://picsum.photos/seed/retinol/600", Galeria: []string{"https://picsum.photos/seed/retinol1/600"}, Activo: true},
		{ID: 6, Nombre: "Crema Contorno de Ojos", Descripcion: "Contorno de ojos con cafeína y péptidos.", Precio: 26.00, Stock: 18, Categoria: "Crema", Img: "https://picsum.photos/seed/ojos/600", Galeria: []string{"https://picsum.photos/seed/ojos1/600"}, Activo: true},
		{ID: 7, Nombre: "Tónico Exfoliante AHA-BHA", Descripcion: "Exfoliación química suave con ácidos AHA y BHA.", Precio: 34.00, Stock: 14, Categoria: "Tónico", Img: "https://picsum.photos/seed/exfoliante/600", Galeria: []string{"https://picsum.photos/seed/exfoliante1/600"}, Activo: true},
		{ID: 8, Nombre: "Kit Rutina Completa", Descripcion: "Kit integral de limpieza, tratamiento e hidratación.", Precio: 129.00, Stock: 8, Categoria: "Kit", Img: "https://picsum.photos/seed/kit/600", Galeria: []string{"https://picsum.photos/seed/kit1/600"}, Activo: true},
		{ID: 9, Nombre: "Protector Solar Facial SPF 50+", Descripcion: "Fluido solar invisible no comedogénico con filtros minerales.", Precio: 36.00, Stock: 30, Categoria: "Protector", Img: "https://picsum.photos/seed/solar/600", Galeria: []string{"https://picsum.photos/seed/solar1/600"}, Activo: true},
		{ID: 10, Nombre: "Gel Limpiador Espumoso", Descripcion: "Limpiador facial suave con pH 5.5 y ceramidas.", Precio: 24.00, Stock: 22, Categoria: "Limpiador", Img: "https://picsum.photos/seed/cleanser/600", Galeria: []string{"https://picsum.photos/seed/cleanser1/600"}, Activo: true},
		{ID: 11, Nombre: "Aceite Facial de Escualano", Descripcion: "Aceite 100% puro que retiene la humedad sin efecto graso.", Precio: 48.00, Stock: 16, Categoria: "Aceite", Img: "https://picsum.photos/seed/oil/600", Galeria: []string{"https://picsum.photos/seed/oil1/600"}, Activo: true},
		{ID: 12, Nombre: "Mascarilla de Arcilla Rosa", Descripcion: "Mascarilla desintoxicante con arcilla francesa purificante.", Precio: 38.50, Stock: 14, Categoria: "Mascarilla", Img: "https://picsum.photos/seed/clay/600", Galeria: []string{"https://picsum.photos/seed/clay1/600"}, Activo: true},
		{ID: 13, Nombre: "Serum Niacinamida 10% + Zinc", Descripcion: "Tratamiento de alta potencia para reducir poros e imperfecciones.", Precio: 42.00, Stock: 19, Categoria: "Serum", Img: "https://picsum.photos/seed/niacinamide/600", Galeria: []string{"https://picsum.photos/seed/niacinamide1/600"}, Activo: true},
		{ID: 14, Nombre: "Bálsamo Labial con Péptidos", Descripcion: "Bálsamo nutritivo con manteca de cacao y péptidos.", Precio: 18.00, Stock: 40, Categoria: "Crema", Img: "https://picsum.photos/seed/lip/600", Galeria: []string{"https://picsum.photos/seed/lip1/600"}, Activo: true},
		{ID: 15, Nombre: "Agua Micelar Calmante", Descripcion: "Solución micelar bifásica con centella asiática para piel sensible.", Precio: 22.00, Stock: 28, Categoria: "Limpiador", Img: "https://picsum.photos/seed/micellar/600", Galeria: []string{"https://picsum.photos/seed/micellar1/600"}, Activo: true},
		{ID: 16, Nombre: "Bruma Hidratante Poliglutámica", Descripcion: "Spray facial ultrafino de hidratación profunda prolongada.", Precio: 30.00, Stock: 15, Categoria: "Tónico", Img: "https://picsum.photos/seed/mist/600", Galeria: []string{"https://picsum.photos/seed/mist1/600"}, Activo: true},
		{ID: 17, Nombre: "Fluido Matificante Mat-Pro", Descripcion: "Emulsión ultraligera reguladora con polvo matificante de bambú.", Precio: 35.00, Stock: 11, Categoria: "Crema", Img: "https://picsum.photos/seed/matt/600", Galeria: []string{"https://picsum.photos/seed/matt1/600"}, Activo: true},
		{ID: 18, Nombre: "Kit Glow Intensivo", Descripcion: "Tratamiento duo con serum revitalizante y mascarilla de arcilla.", Precio: 78.00, Stock: 7, Categoria: "Kit", Img: "https://picsum.photos/seed/glowkit/600", Galeria: []string{"https://picsum.photos/seed/glowkit1/600"}, Activo: true},
	}
)

// ObtenerProductos consulta el catálogo desde PostgreSQL 16 o memoria si la DB está inactiva.
func ObtenerProductos(ctx context.Context) ([]models.Producto, error) {
	if config.DBPool != nil {
		rows, err := config.DBPool.Query(ctx, `
			SELECT id, nombre, descripcion, precio, stock, categoria, img, galeria, activo
			FROM productos
			WHERE activo = true
			ORDER BY id ASC
		`)
		if err == nil {
			defer rows.Close()
			var prods []models.Producto
			for rows.Next() {
				var p models.Producto
				if err := rows.Scan(&p.ID, &p.Nombre, &p.Descripcion, &p.Precio, &p.Stock, &p.Categoria, &p.Img, &p.Galeria, &p.Activo); err == nil {
					prods = append(prods, p)
				}
			}
			if len(prods) > 0 {
				return prods, nil
			}
		} else {
			log.Printf("[WARN] Falló consulta SQL a productos: %v. Usando fallback en memoria.", err)
		}
	}

	memMutex.RLock()
	defer memMutex.RUnlock()
	var activos []models.Producto
	for _, p := range memProductos {
		if p.Activo {
			activos = append(activos, p)
		}
	}
	return activos, nil
}

// ObtenerProductoPorID busca un artículo específico por su ID.
func ObtenerProductoPorID(ctx context.Context, id int) (*models.Producto, error) {
	if config.DBPool != nil {
		var p models.Producto
		err := config.DBPool.QueryRow(ctx, `
			SELECT id, nombre, descripcion, precio, stock, categoria, img, galeria, activo
			FROM productos
			WHERE id = $1 AND activo = true
		`, id).Scan(&p.ID, &p.Nombre, &p.Descripcion, &p.Precio, &p.Stock, &p.Categoria, &p.Img, &p.Galeria, &p.Activo)
		if err == nil {
			return &p, nil
		}
	}

	memMutex.RLock()
	defer memMutex.RUnlock()
	for _, p := range memProductos {
		if p.ID == id && p.Activo {
			return &p, nil
		}
	}
	return nil, fmt.Errorf("producto con ID %d no encontrado", id)
}

// ObtenerRed construye la jerarquía multinivel desde PostgreSQL o memoria.
func ObtenerRed(ctx context.Context, userEmail string) (*models.Referido, error) {
	if config.DBPool != nil {
		rows, err := config.DBPool.Query(ctx, `
			SELECT id, nombre, codigo, nivel, ventas, parent_id
			FROM referidos
			ORDER BY nivel ASC, id ASC
		`)
		if err == nil {
			defer rows.Close()
			nodes := make(map[int]*models.Referido)
			var rootID *int

			for rows.Next() {
				var r models.Referido
				if err := rows.Scan(&r.ID, &r.Nombre, &r.Codigo, &r.Nivel, &r.Ventas, &r.ParentID); err == nil {
					r.Hijos = []models.Referido{}
					nodes[r.ID] = &r
					if r.ParentID == nil && rootID == nil {
						id := r.ID
						rootID = &id
					}
				}
			}

			// Ensamblar árbol
			for _, node := range nodes {
				if node.ParentID != nil {
					if parent, exists := nodes[*node.ParentID]; exists {
						parent.Hijos = append(parent.Hijos, *node)
					}
				}
			}

			if rootID != nil && nodes[*rootID] != nil {
				return nodes[*rootID], nil
			}
		}
	}

	// Fallback del árbol en memoria
	root := &models.Referido{
		ID: 0, Nombre: "Tú", Codigo: "TU", Nivel: 0, Ventas: 2400.00,
		Hijos: []models.Referido{
			{
				ID: 1, Nombre: "Ana García", Codigo: "ANA", Nivel: 1, Ventas: 1200.00,
				Hijos: []models.Referido{
					{ID: 4, Nombre: "Carlos Ruiz", Codigo: "CARLOS", Nivel: 2, Ventas: 500.00, Hijos: []models.Referido{
						{ID: 7, Nombre: "Diana Paz", Codigo: "DIANA", Nivel: 3, Ventas: 300.00},
					}},
					{ID: 5, Nombre: "Sofía León", Codigo: "SOFIA", Nivel: 2, Ventas: 430.00},
				},
			},
			{
				ID: 2, Nombre: "Luis Poveda", Codigo: "LUIS", Nivel: 1, Ventas: 850.00,
				Hijos: []models.Referido{
					{ID: 6, Nombre: "Marco Díaz", Codigo: "MARCO", Nivel: 2, Ventas: 380.00},
				},
			},
			{ID: 3, Nombre: "Marta Sánchez", Codigo: "MARTA", Nivel: 1, Ventas: 430.00},
		},
	}
	return root, nil
}

// CrearPedidoTransaccional ejecuta una compra aplicando bloqueo pesimista ACID (SELECT FOR UPDATE).
func CrearPedidoTransaccional(ctx context.Context, req models.CheckoutRequest, totalCalculado float64) (int, error) {
	if config.DBPool != nil {
		tx, err := config.DBPool.Begin(ctx)
		if err != nil {
			return 0, fmt.Errorf("error al iniciar transacción en PostgreSQL: %w", err)
		}
		defer func() {
			_ = tx.Rollback(ctx)
		}()

		// 1. Validar y descontar stock con bloqueo pesimista
		for _, item := range req.Items {
			var stockActual int
			err := tx.QueryRow(ctx, "SELECT stock FROM productos WHERE id = $1 FOR UPDATE", item.ProductoID).Scan(&stockActual)
			if err != nil {
				if err == pgx.ErrNoRows {
					return 0, models.APIError{Status: 404, Message: fmt.Sprintf("Producto %d no encontrado", item.ProductoID)}
				}
				return 0, fmt.Errorf("error al bloquear stock de producto: %w", err)
			}

			if stockActual < item.Cantidad {
				return 0, models.APIError{Status: 400, Message: fmt.Sprintf("Stock insuficiente para el producto %d", item.ProductoID)}
			}

			_, err = tx.Exec(ctx, "UPDATE productos SET stock = stock - $1 WHERE id = $2", item.Cantidad, item.ProductoID)
			if err != nil {
				return 0, fmt.Errorf("error al descontar stock: %w", err)
			}
		}

		// 2. Insertar pedido principal
		var pedidoID int
		err = tx.QueryRow(ctx, `
			INSERT INTO pedidos (cliente_email, total, estado)
			VALUES ($1, $2, 'pendiente')
			RETURNING id
		`, req.Email, totalCalculado).Scan(&pedidoID)
		if err != nil {
			return 0, fmt.Errorf("error al registrar pedido: %w", err)
		}

		// 3. Insertar detalle de ítems
		for _, item := range req.Items {
			_, err = tx.Exec(ctx, `
				INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
				SELECT $1, $2, $3, precio FROM productos WHERE id = $2
			`, pedidoID, item.ProductoID, item.Cantidad)
			if err != nil {
				return 0, fmt.Errorf("error al insertar ítem de pedido: %w", err)
			}
		}

		// 4. Registrar comisiones en ledger
		tasas := []struct {
			Nivel      int
			ReferidoID int
			Porcentaje float64
		}{
			{Nivel: 1, ReferidoID: 2, Porcentaje: 0.10},
			{Nivel: 2, ReferidoID: 1, Porcentaje: 0.05},
			{Nivel: 3, ReferidoID: 0, Porcentaje: 0.02},
		}

		for _, t := range tasas {
			monto := totalCalculado * t.Porcentaje
			_, _ = tx.Exec(ctx, `
				INSERT INTO comisiones (pedido_id, referido_id, nivel, porcentaje, monto, estado)
				VALUES ($1, $2, $3, $4, $5, 'pendiente')
			`, pedidoID, t.ReferidoID, t.Nivel, t.Porcentaje, monto)
		}

		// Confirmación atómica
		if err := tx.Commit(ctx); err != nil {
			return 0, fmt.Errorf("error en COMMIT de la transacción: %w", err)
		}

		return pedidoID, nil
	}

	// Fallback si la DB está inactiva
	memMutex.Lock()
	defer memMutex.Unlock()

	for _, item := range req.Items {
		for i := range memProductos {
			if memProductos[i].ID == item.ProductoID {
				if memProductos[i].Stock < item.Cantidad {
					return 0, models.APIError{Status: 400, Message: "Stock insuficiente"}
				}
				memProductos[i].Stock -= item.Cantidad
			}
		}
	}

	return 1000 + rand.Intn(9000), nil
}
