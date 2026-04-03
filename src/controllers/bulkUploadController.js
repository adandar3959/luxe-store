const fs = require('fs');
const csv = require('csv-parser');
const Product = require('../models/productModel'); // Verify this path is correct!

const uploadBulkProducts = (req, res) => {
    // 1. Check if file exists
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            // DEBUG: Log the first row to check headers
            if (results.length === 0) console.log("First Row Data:", data);

            // 2. Map CSV columns to Database Fields
            // Use fallback values (|| 0) to prevent Database Errors if cells are empty
            results.push({
                name: data.name,
                price: Number(data.price) || 0,
                brand: data.brand || 'Generic',
                category: data.category || 'Uncategorized',
                image: data.image || '',
                description: data.description || '',
                countInStock: Number(data.stock) || Number(data.countInStock) || 0,
                user: req.user._id,
                rating: 0,
                numReviews: 0
            });
        })
        .on('end', async () => {
            try {
                console.log(`Processing ${results.length} products...`);

                if (results.length === 0) {
                    throw new Error("CSV parsed but found 0 rows. Check headers!");
                }

                // 3. Insert into MongoDB
                await Product.insertMany(results);
                
                console.log("Success! Products Inserted.");
                
                // Cleanup
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                
                res.status(201).json({ message: 'Upload successful!', count: results.length });

            } catch (error) {
                console.error("Database Insert Error:", error.message);
                
                // Cleanup
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                
                res.status(500).json({ error: error.message });
            }
        })
        .on('error', (err) => {
            console.error("CSV Parse Error:", err);
            res.status(500).json({ error: "Failed to parse CSV file" });
        });
};

module.exports = { uploadBulkProducts };