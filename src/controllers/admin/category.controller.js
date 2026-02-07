const { Category, Product, ProductImage, CartItem, sequelize } = require("../../models");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

exports.showCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["createdAt", "DESC"]]
    });

    return res.render("admin/categories/index", {
      categories,
      error: req.query.error
    });
  } catch (error) {
    console.error("Show categories error:", error);
    return res.status(500).send("Something went wrong");
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.redirect("/admin/categories");
    }

    await Category.create({ name });

    return res.redirect("/admin/categories");
  } catch (error) {
    console.error("Create category error:", error);
    return res.redirect("/admin/categories");
  }
};

exports.deleteCategory = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const categoryId = req.params.id;

    // Find all products under this category
    const products = await Product.findAll({ where: { categoryId } });

    for (const product of products) {
      // If product exists in any cart, block deletion of the category
      const cartExists = await CartItem.findOne({ where: { productId: product.id }, transaction: t });
      if (cartExists) {
        await t.rollback();
        return res.redirect(`/admin/categories?error=${encodeURIComponent(`Cannot delete category. Product "${product.title}" exists in customer carts.`)}`);
      }

      // Remove images (S3) and image records
      const images = await ProductImage.findAll({ where: { productId: product.id } });
      for (const image of images) {
        try {
          if (image.path && (image.path.startsWith('http') || image.path.startsWith('https'))) {
            const imageKey = new URL(image.path).pathname.substring(1);
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: imageKey,
            }));
          } else if (image.path) {
            const imagePath = path.join(__dirname, "../../", image.path);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }
        } catch (e) {
          console.error('Failed deleting image for product', product.id, e);
        }
        try {
          await image.destroy({ transaction: t });
        } catch (e) {
          console.error('Failed destroying image record', image.id, e);
        }
      }

      // Delete the product itself.
      try {
        await Product.destroy({ where: { id: product.id }, transaction: t });
      } catch (e) {
        console.error('Failed deleting product', product.id, e);
        throw e; // Rethrow to trigger rollback
      }
    }

    // Finally delete the category
    await Category.destroy({ where: { id: categoryId }, transaction: t });

    await t.commit();
    return res.redirect("/admin/categories");
  } catch (error) {
    if (t) await t.rollback();
    console.error("Delete category error:", error);
    let message = "Category deletion failed";
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      message = "Cannot delete category. One or more products are referenced in existing orders.";
    }
    return res.redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
  }
};
