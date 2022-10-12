const notFoundMiddleware = (req,res)=>res.status(404).send('Rout dose not exist');

export default notFoundMiddleware