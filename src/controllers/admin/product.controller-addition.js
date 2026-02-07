// Add showProduct method after showProducts
exports.showProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findByPk(productId, {
            include: [
                {
                    model: Category,
                    attributes: ["id", "name"]
                },
                {
                    model: ProductImage,
                    attributes: ["id", "path"]
                }
            ]
        });

        if (!product) {
            return res.redirect("/admin/products");
        }

        return res.render("admin/products/show", {
            product
        });

    } catch (error) {
        console.error("Show product error:", error);
        return res.redirect("/admin/products");
    }
};
