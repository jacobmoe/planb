export const port = 5000
export const action = "get"
export const allowedActions = ["get", "post", "put", "delete"]
export const endpoint = { "port": port, [action]: [], "default": true }
export const configData = { "endpoints": [endpoint] }
