const { Product, Category, ProductImage, CartItem } = require("../../models");
const { Op } = require("sequelize");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");  // NEW: For S3 delete
const path = require("path");
const fs = require("fs");

// S3 Client for deletes
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

exports.showProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const categoryId = req.query.category || "";

    const whereCondition = {};

    if (search) {
      whereCondition.title = {
        [Op.iLike]: `%${search}%`
      };
    }

    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    const { rows: products, count } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Category,
          attributes: ["id", "name"]
        },
        {
          model: ProductImage,
          attributes: ["path"],
          limit: 1
        }
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });

    const categories = await Category.findAll({
      attributes: ["id", "name"]
    });

    const totalPages = Math.ceil(count / limit);

    return res.render("admin/products/index", {
      products,
      categories,
      currentPage: page,
      totalPages,
      search,
      selectedCategory: categoryId,
      error: req.query.error
    });

  } catch (error) {
    console.error("Admin product list error:", error);
    return res.status(500).send("Something went wrong");
  }
};

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

exports.showCreateProduct = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ["id", "name"]
    });

    return res.render("admin/products/create", {
      categories
    });
  } catch (error) {
    console.error("Create product page error:", error);
    return res.status(500).send("Something went wrong");
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      qtyAvailable,
      categoryId
    } = req.body;

    const product = await Product.create({
      title,
      description,
      price,
      qtyAvailable,
      categoryId,
      createdBy: req.user.id
    });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await ProductImage.create({
          productId: product.id,
          path: file.location
        });
      }
    }

    return res.redirect("/admin/products");

  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).send("Product creation failed");
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // If product exists in any cart, block deletion per new logic
    const cartExists = await CartItem.findOne({ where: { productId } });
    if (cartExists) {
      return res.redirect(`/admin/products?error=${encodeURIComponent("Cannot delete product. It exists in customer carts.")}`);
    }

    // Remove product image(s) from S3 or local filesystem, then delete image records
    const images = await ProductImage.findAll({ where: { productId } });
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
        console.error('Failed deleting product image', productId, e);
      }
      try {
        await image.destroy();
      } catch (e) {
        console.error('Failed destroying product image record', image.id, e);
      }
    }

    // Delete the product
    await Product.destroy({ where: { id: productId } });

    return res.redirect("/admin/products");

  } catch (err) {
    console.error("Delete product error:", err);
    let message = "Product deletion failed";
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      message = "Cannot delete product. It is referenced in existing orders.";
    }
    return res.redirect(`/admin/products?error=${encodeURIComponent(message)}`);
  }
};

exports.showEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId, {
      include: [
        Category,
        { model: ProductImage, limit: 1 }
      ]
    });

    if (!product) {
      return res.redirect("/admin/products");
    }

    const categories = await Category.findAll();

    return res.render("admin/products/edit", {
      product,
      categories
    });

  } catch (error) {
    console.error("Show edit product error:", error);
    return res.redirect("/admin/products");
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      title,
      description,
      price,
      qtyAvailable,
      categoryId
    } = req.body;

    const [updated] = await Product.update(
      { title, description, price, qtyAvailable, categoryId },
      { where: { id: productId } }
    );

    if (!updated) {
      return res.status(404).send("Product not found");
    }

    if (req.file) {
      const oldImage = await ProductImage.findOne({
        where: { productId }
      });

      if (oldImage) {
        // NEW: Delete old from S3
        const oldKey = new URL(oldImage.path).pathname.substring(1);
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: oldKey,
        }));
        await oldImage.destroy();
      }

      await ProductImage.create({
        productId,
        path: req.file.location  // NEW: Full S3 URL
      });
    }

    return res.redirect("/admin/products");

  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).send("Product update failed");
  }
};