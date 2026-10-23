// Declaramos el paquete models para agrupar las estructuras de datos de la aplicación.
package models

// APIError define el contrato canónico de error HTTP para toda la API.
type APIError struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Error implementa la interfaz error de Go para APIError.
func (e APIError) Error() string {
	return e.Message
}

// LoginRequest define la estructura esperada para el cuerpo de la petición (JSON) al iniciar sesión.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Usuario representa a una cuenta de usuario en el sistema.
type Usuario struct {
	ID         int    `json:"id"`
	Email      string `json:"email"`
	Password   string `json:"-"`
	Nombre     string `json:"nombre"`
	Rol        string `json:"rol"` // "admin" o "cliente"
	Activo     bool   `json:"activo"`
	ReferidoID *int   `json:"referido_id,omitempty"`
}

// Producto define la estructura enriquecida de un artículo en nuestro catálogo.
type Producto struct {
	ID          int      `json:"id"`
	Nombre      string   `json:"nombre"`
	Descripcion string   `json:"descripcion"`
	Precio      float64  `json:"precio"`
	Stock       int      `json:"stock"`
	Categoria   string   `json:"categoria"`
	Img         string   `json:"img"`
	Galeria     []string `json:"galeria"`
	Activo      bool     `json:"activo"`
}

// Referido representa un nodo en el árbol multinivel.
type Referido struct {
	ID       int        `json:"id"`
	Nombre   string     `json:"nombre"`
	Codigo   string     `json:"codigo,omitempty"`
	Nivel    int        `json:"nivel"`  // 1 = directo, 2 = secundario, 3 = terciario
	Ventas   float64    `json:"ventas"` // acumulado de ventas
	ParentID *int       `json:"parent_id,omitempty"`
	Hijos    []Referido `json:"hijos,omitempty"`
}

// ItemPedido define un producto adquirido y su cantidad en la orden.
type ItemPedido struct {
	ProductoID     int     `json:"producto_id"`
	Cantidad       int     `json:"cantidad"`
	PrecioUnitario float64 `json:"precio_unitario,omitempty"`
}

// CheckoutRequest define el payload enviado por el frontend al realizar una compra.
type CheckoutRequest struct {
	Nombre     string       `json:"nombre"`
	Email      string       `json:"email"`
	Direccion  string       `json:"direccion"`
	Ciudad     string       `json:"ciudad"`
	Telefono   string       `json:"telefono"`
	MetodoPago string       `json:"metodoPago"`
	Items      []ItemPedido `json:"items"`
	Total      float64      `json:"total"`
}

// Pedido representa la orden de compra persistida.
type Pedido struct {
	ID           int          `json:"id"`
	ClienteEmail string       `json:"cliente_email"`
	Total        float64      `json:"total"`
	Estado       string       `json:"estado"` // "pendiente", "preparando", "enviado", "entregado", "cancelado"
	UsuarioID    *int         `json:"usuario_id,omitempty"`
	Items        []ItemPedido `json:"items,omitempty"`
}
