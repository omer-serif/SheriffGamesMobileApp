const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Resim Klasörü
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// 1. VERİTABANI BAĞLANTISI
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'berkay4115',
    database: 'SheriffGames',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('❌ HATA: Veritabanına bağlanılamadı!', err);
        return;
    }
    console.log('✅ BAŞARILI: MySQL Veritabanına bağlandı!');
});

// 2. MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// YARDIMCI FONKSİYON: DOSYA SİLME
const deleteFileFromStorage = (filename) => {
    if (!filename) return;
    const filePath = path.join(__dirname, 'uploads', filename);
    fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') console.error(`Dosya silinemedi: ${filename}`, err);
    });
};

// 3. API YOLLARI
app.get('/', (req, res) => res.json("Backend Çalışıyor!"));

app.get('/game-types', (req, res) => {
    const sql = "SELECT * FROM gametypes";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.get('/asset-types', (req, res) => {
    const sql = "SELECT * FROM assettypes";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.get('/games', (req, res) => {
    const { search, category, priceType } = req.query;
    let sql = `
        SELECT G.gamesID, G.gameName, G.gamePrice, G.gameDescription, G.gameImage, G.gameFile,
        GROUP_CONCAT(GT.gameType SEPARATOR ', ') as categoryNames 
        FROM Games G
        LEFT JOIN gametypes_game GTG ON G.gamesID = GTG.game
        LEFT JOIN gametypes GT ON GTG.gameType = GT.gameTypeID
        WHERE 1=1 
    `;
    let params = [];
    if (search && search.trim() !== '') { sql += " AND G.gameName LIKE ?"; params.push(`%${search}%`); }
    if (priceType && priceType !== 'all') {
        if (priceType === 'free') sql += " AND (G.gamePrice = 0 OR G.gamePrice IS NULL)";
        else if (priceType === 'paid') sql += " AND G.gamePrice > 0";
    }
    if (category && category !== 'All') {
        sql += ` AND G.gamesID IN (SELECT game FROM gametypes_game WHERE gameType = (SELECT gameTypeID FROM gametypes WHERE gameType = ?))`;
        params.push(category);
    }
    sql += ` GROUP BY G.gamesID, G.gameName, G.gamePrice, G.gameDescription, G.gameImage, G.gameFile ORDER BY G.gamesID DESC`;
    db.query(sql, params, (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        return res.json(data);
    });
});

app.get('/assets', (req, res) => {
    const { search, type, priceType } = req.query;
    let sql = `
        SELECT A.assetID, A.assetName, A.assetPrice, A.assetDescription, A.assetImage, A.assetFile,
        GROUP_CONCAT(AT.type SEPARATOR ', ') as typeNames 
        FROM Assets A
        LEFT JOIN assettypes_asset ATA ON A.assetID = ATA.asset
        LEFT JOIN assettypes AT ON ATA.assetType = AT.assetTypeID
        WHERE 1=1
    `;
    let params = [];
    if (search && search.trim() !== '') { sql += " AND A.assetName LIKE ?"; params.push(`%${search}%`); }
    if (priceType && priceType !== 'all') {
        if (priceType === 'free') sql += " AND (A.assetPrice = 0 OR A.assetPrice IS NULL)";
        else if (priceType === 'paid') sql += " AND A.assetPrice > 0";
    }
    if (type && type !== 'All') {
        sql += " AND A.assetID IN (SELECT asset FROM assettypes_asset WHERE assetType = ?)";
        params.push(type);
    }
    sql += " GROUP BY A.assetID, A.assetName, A.assetPrice, A.assetDescription, A.assetImage, A.assetFile ORDER BY A.assetID DESC";
    db.query(sql, params, (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        return res.json(data);
    });
});

app.get('/games/:id', (req, res) => {
    const sqlGame = `
        SELECT G.gamesID, G.gameName, G.gamePrice, G.gameDescription, G.gameImage, G.gameFile, U.userName as publisherName, 
        GROUP_CONCAT(GT.gameType SEPARATOR ', ') as categoryNames 
        FROM games G
        LEFT JOIN usergamedevelops UGD ON G.gamesID = UGD.game
        LEFT JOIN user U ON UGD.user = U.userID
        LEFT JOIN gametypes_game GTG ON G.gamesID = GTG.game
        LEFT JOIN gametypes GT ON GTG.gameType = GT.gameTypeID
        WHERE G.gamesID = ?
        GROUP BY G.gamesID, G.gameName, G.gamePrice, G.gameDescription, G.gameImage, G.gameFile, U.userName
    `;
    const sqlImages = `SELECT image FROM GameImages WHERE gameID = ?`;
    db.query(sqlGame, [req.params.id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.status(404).json({ message: "Oyun bulunamadı" });
        const gameData = data[0];
        db.query(sqlImages, [req.params.id], (err2, imagesData) => {
            if (err2) { gameData.galleryImages = []; return res.json(gameData); }
            gameData.galleryImages = imagesData.map(img => img.image);
            return res.json(gameData);
        });
    });
});

app.get('/assets/:id', (req, res) => {
    const sql = `
        SELECT A.assetID, A.assetName, A.assetPrice, A.assetDescription, A.assetImage, A.assetFile, U.userName as publisherName,
        GROUP_CONCAT(AT.type SEPARATOR ', ') as typeNames 
        FROM assets A
        LEFT JOIN userassetdevelops UAD ON A.assetID = UAD.asset
        LEFT JOIN user U ON UAD.user = U.userID
        LEFT JOIN assettypes_asset ATA ON A.assetID = ATA.asset
        LEFT JOIN assettypes AT ON ATA.assetType = AT.assetTypeID
        WHERE A.assetID = ?
        GROUP BY A.assetID, A.assetName, A.assetPrice, A.assetDescription, A.assetImage, A.assetFile, U.userName
    `;
    const sqlImages = `SELECT image FROM AssetImages WHERE assetID = ?`;
    db.query(sql, [req.params.id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.status(404).json({ message: "Asset bulunamadı" });
        const assetData = data[0];
        db.query(sqlImages, [req.params.id], (err2, imagesData) => {
            if (err2) { assetData.galleryImages = []; return res.json(assetData); }
            assetData.galleryImages = imagesData.map(img => img.image);
            return res.json(assetData);
        });
    });
});

app.post('/api/add-game', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'gameFile', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), (req, res) => {
    // isTestGame değerini req.body'den çıkarıyoruz
    const { gameName, gameDescription, gamePrice, gameTypes, userID, isTestGame } = req.body;
    const coverImage = req.files['coverImage'] ? req.files['coverImage'][0].filename : null;
    const gameFile = req.files['gameFile'] ? req.files['gameFile'][0].filename : null;
    const galleryImages = req.files['galleryImages'] || [];
    let typeIDs = []; try { typeIDs = JSON.parse(gameTypes); } catch (e) { }

    db.beginTransaction((err) => {
        if (err) return res.status(500).json(err);

        const sqlGame = "INSERT INTO Games (`gameName`, `gameDescription`, `gamePrice`, `gameImage`, `gameFile`) VALUES (?)";
        db.query(sqlGame, [[gameName, gameDescription, gamePrice, coverImage, gameFile]], (err, result) => {
            // 1. Önce hatayı kontrol et (Sistem çökmesini engeller)
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

            const newID = result.insertId;

            // 2. Eğer oyun eklendiyse ve Test Oyunu ise TestGames tablosuna yaz
            if (isTestGame === 'true') {
                db.query("INSERT INTO TestGames (gameId) VALUES (?)", [newID], (testErr) => {
                    if (testErr) console.error("Test game eklenemedi: ", testErr);
                });
            }

            const sqlRel = "INSERT INTO UserGameDevelops (`user`, `game`) VALUES (?, ?)";
            db.query(sqlRel, [userID, newID], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                const addCategories = (callback) => {
                    if (typeIDs.length > 0) {
                        const typeValues = typeIDs.map(id => [newID, id]);
                        db.query("INSERT INTO gametypes_game (`game`, `gameType`) VALUES ?", [typeValues], callback);
                    } else callback(null);
                };

                const addGalleryImages = (callback) => {
                    if (galleryImages.length > 0) {
                        const imageValues = galleryImages.map(file => [newID, file.filename]);
                        db.query("INSERT INTO GameImages (`gameID`, `image`) VALUES ?", [imageValues], callback);
                    } else callback(null);
                };

                addCategories((err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    addGalleryImages((err) => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        db.commit((err) => {
                            if (err) return db.rollback(() => res.status(500).json(err));
                            res.json({ status: "Success", message: "Oyun ve görseller başarıyla yüklendi!" });
                        });
                    });
                });
            });
        });
    });
});

// --- 1. KÜTÜPHANEM (OYUNCU) API'Sİ ---
app.get('/api/my-library/:userId', (req, res) => {
    const userId = req.params.userId;

    const gameQuery = `
    SELECT g.gamesID as itemID, g.gameName as itemName, g.gameImage as itemImage, 'Game' as itemType,
           IF(tg.id IS NOT NULL, 1, 0) as isTestGame 
    FROM userbygame ubg
    JOIN Games g ON ubg.game = g.gamesID
    LEFT JOIN TestGames tg ON g.gamesID = tg.gameId
    WHERE ubg.user = ?
    ORDER BY ubg.purchaseDate DESC
  `;

    const assetQuery = `
    SELECT a.assetID as itemID, a.assetName as itemName, a.assetImage as itemImage, 'Asset' as itemType,
           0 as isTestGame 
    FROM userbyasset uba
    JOIN Assets a ON uba.asset = a.assetID
    WHERE uba.user = ?
    ORDER BY uba.purchaseDate DESC
  `;

    // Oyunları ve Assetleri paralel çekip tek bir JSON objesinde dönüyoruz
    db.query(gameQuery, [userId], (err, games) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query(assetQuery, [userId], (err, assets) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ games: games, assets: assets });
        });
    });
});
// --- 2. TEST MEDYASI YÜKLEME API'Sİ ---
// Test dosyaları için Multer ayarı (Fotoğraflar ve Videolar için)
const testMediaStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'test-media-' + Date.now() + path.extname(file.originalname))
});
const uploadTestMedia = multer({ storage: testMediaStorage });

app.post('/api/upload-test-media', uploadTestMedia.single('mediaFile'), (req, res) => {
    const { gameId, userId, mediaType } = req.body; // mediaType: 'video' veya 'image'
    const filePath = req.file ? req.file.filename : null;

    if (!filePath) return res.status(400).json({ error: 'Medya dosyası alınamadı.' });

    const table = mediaType === 'video' ? 'TestVideos' : 'TestImages';
    const column = mediaType === 'video' ? 'videoPath' : 'imagePath';

    const query = `INSERT INTO ${table} (gameId, userId, ${column}) VALUES (?, ?, ?)`;

    db.query(query, [gameId, userId, filePath], (err, result) => {
        if (err) {
            console.error("Test medyası veritabanına eklenemedi:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ status: "Success", message: "Test geri bildiriminiz başarıyla gönderildi!" });
    });
});

app.post('/api/add-asset', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'assetFile', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), (req, res) => {
    const { assetName, assetDescription, assetPrice, assetTypes, userID } = req.body;
    const assetImage = req.files['coverImage'] ? req.files['coverImage'][0].filename : null;
    const assetFile = req.files['assetFile'] ? req.files['assetFile'][0].filename : null;
    const galleryImages = req.files['galleryImages'] || [];
    let typeIDs = []; try { typeIDs = JSON.parse(assetTypes); } catch (e) { }

    db.beginTransaction((err) => {
        if (err) return res.status(500).json(err);
        const sql = "INSERT INTO Assets (`assetName`, `assetDescription`, `assetPrice`, `assetImage`, `assetFile`) VALUES (?)";
        db.query(sql, [[assetName, assetDescription, assetPrice, assetImage, assetFile]], (err, result) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
            const newID = result.insertId;
            const sqlRel = "INSERT INTO UserAssetDevelops (`user`, `asset`) VALUES (?, ?)";
            db.query(sqlRel, [userID, newID], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                const addCategories = (callback) => {
                    if (typeIDs.length > 0) {
                        const typeValues = typeIDs.map(id => [newID, id]);
                        db.query("INSERT INTO assettypes_asset (`asset`, `assetType`) VALUES ?", [typeValues], callback);
                    } else callback(null);
                };
                const addGalleryImages = (callback) => {
                    if (galleryImages.length > 0) {
                        const imageValues = galleryImages.map(file => [newID, file.filename]);
                        db.query("INSERT INTO AssetImages (`assetID`, `image`) VALUES ?", [imageValues], callback);
                    } else callback(null);
                };
                addCategories((err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    addGalleryImages((err) => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        db.commit((err) => { if (err) return db.rollback(() => res.status(500).json(err)); res.json({ status: "Success", message: "Asset ve görseller başarıyla yüklendi!" }); });
                    });
                });
            });
        });
    });
});

// AUTH
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM User WHERE (userMail = ? OR userName = ?) AND userPassword = ?", [email, email, password], (err, data) => {
        if (err) return res.status(500).json("Hata");
        if (data.length > 0) return res.json({ status: "Success", user: data[0] });
        return res.status(401).json({ status: "Error", message: "Hatalı bilgi" });
    });
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    db.query("INSERT INTO User (`userName`, `userMail`, `userPassword`) VALUES (?)", [[username, email, password]], (err) => {
        if (err) return res.status(500).json({ status: "Error" });
        return res.json({ status: "Success" });
    });
});

// DASHBOARD
app.get('/api/my-games/:userID', (req, res) => {
    const sql = `SELECT Games.* FROM Games JOIN UserGameDevelops ON Games.gamesID = UserGameDevelops.game WHERE UserGameDevelops.user = ?`;
    db.query(sql, [req.params.userID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});
app.get('/api/my-assets/:userID', (req, res) => {
    const sql = `SELECT Assets.* FROM Assets JOIN UserAssetDevelops ON Assets.assetID = UserAssetDevelops.asset WHERE UserAssetDevelops.user = ?`;
    db.query(sql, [req.params.userID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});
app.get('/api/my-sales/:userID', (req, res) => {
    const sellerID = req.params.userID;
    const sql = `
        SELECT 'Game' as itemType, G.gameName as itemName, G.gamePrice as price, U.userName as buyerName, UBG.purchaseDate as saleDate FROM UserByGame UBG JOIN Games G ON UBG.game = G.gamesID JOIN UserGameDevelops UGD ON G.gamesID = UGD.game JOIN User U ON UBG.user = U.userID WHERE UGD.user = ?
        UNION ALL
        SELECT 'Asset' as itemType, A.assetName as itemName, A.assetPrice as price, U.userName as buyerName, UBA.purchaseDate as saleDate FROM UserByAsset UBA JOIN Assets A ON UBA.asset = A.assetID JOIN UserAssetDevelops UAD ON A.assetID = UAD.asset JOIN User U ON UBA.user = U.userID WHERE UAD.user = ? ORDER BY saleDate DESC`;
    db.query(sql, [sellerID, sellerID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// ==========================================
// DÜZENLEME VE RESİM YÖNETİMİ İŞLEMLERİ (GÜNCELLENDİ)
// ==========================================

// 1. DÜZENLEME İÇİN GALERİ RESİMLERİNİ ÇEK
app.get('/api/get-edit-details/:type/:id', (req, res) => {
    const { type, id } = req.params;
    let sqlImages = type === 'Game' ? "SELECT imageID, image FROM GameImages WHERE gameID = ?" : "SELECT imageID, image FROM AssetImages WHERE assetID = ?";
    db.query(sqlImages, [id], (err, images) => {
        if (err) return res.status(500).json(err);
        return res.json({ galleryImages: images });
    });
});

// 2. TEKİL GALERİ RESMİ SİLME
app.delete('/api/delete-gallery-image', (req, res) => {
    const { type, imageID, imageName } = req.body;
    deleteFileFromStorage(imageName);
    let sql = type === 'Game' ? "DELETE FROM GameImages WHERE imageID = ?" : "DELETE FROM AssetImages WHERE imageID = ?";
    db.query(sql, [imageID], (err) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: "Success", message: "Resim silindi." });
    });
});

// 3. GELİŞMİŞ GÜNCELLEME (Text + Kapak + Yeni Galeri + SİLİNECEK GALERİ)
app.put('/api/update-item', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'newGalleryImages', maxCount: 10 }
]), (req, res) => {
    const { type, id, name, description, price, deletedImageIDs, isTestGame } = req.body;

    // Yeni dosyalar
    const newCover = req.files['coverImage'] ? req.files['coverImage'][0].filename : null;
    const newGallery = req.files['newGalleryImages'] || [];

    // Silinecek ID'leri parse et
    let idsToDelete = [];
    try {
        idsToDelete = JSON.parse(deletedImageIDs || "[]");
    } catch (e) {
        idsToDelete = [];
    }

    db.beginTransaction((err) => {
        if (err) return res.status(500).json(err);

        // 1. TEMEL BİLGİLERİ GÜNCELLE
        let sqlUpdate = "";
        let params = [name, description, price];

        if (type === 'Game') {
            if (newCover) {
                db.query("SELECT gameImage FROM Games WHERE gamesID = ?", [id], (err, resImg) => {
                    if (resImg && resImg.length > 0) deleteFileFromStorage(resImg[0].gameImage);
                });
                sqlUpdate = "UPDATE Games SET gameName=?, gameDescription=?, gamePrice=?, gameImage=? WHERE gamesID=?";
                params.push(newCover);
            } else {
                sqlUpdate = "UPDATE Games SET gameName=?, gameDescription=?, gamePrice=? WHERE gamesID=?";
            }
        } else {
            // Asset
            if (newCover) {
                db.query("SELECT assetImage FROM Assets WHERE assetID = ?", [id], (err, resImg) => {
                    if (resImg && resImg.length > 0) deleteFileFromStorage(resImg[0].assetImage);
                });
                sqlUpdate = "UPDATE Assets SET assetName=?, assetDescription=?, assetPrice=?, assetImage=? WHERE assetID=?";
                params.push(newCover);
            } else {
                sqlUpdate = "UPDATE Assets SET assetName=?, assetDescription=?, assetPrice=? WHERE assetID=?";
            }
        }
        params.push(id);

        db.query(sqlUpdate, params, (err) => {
            if (err) return db.rollback(() => res.status(500).json(err));

            // 2. SİLİNMESİ İSTENEN GALERİ RESİMLERİNİ SİL
            const processDeletions = (callback) => {
                if (idsToDelete.length > 0) {
                    let sqlFind = type === 'Game'
                        ? `SELECT image FROM GameImages WHERE imageID IN (?)`
                        : `SELECT image FROM AssetImages WHERE imageID IN (?)`;

                    db.query(sqlFind, [idsToDelete], (errFind, results) => {
                        if (errFind) return callback(errFind);
                        results.forEach(img => deleteFileFromStorage(img.image));

                        let sqlDel = type === 'Game'
                            ? `DELETE FROM GameImages WHERE imageID IN (?)`
                            : `DELETE FROM AssetImages WHERE imageID IN (?)`;

                        db.query(sqlDel, [idsToDelete], callback);
                    });
                } else {
                    callback(null);
                }
            };

            // 3. TEST PROGRAMI DURUMUNU GÜNCELLE
            const processTestProgram = (callback) => {
                if (type === 'Game' && isTestGame !== undefined) {
                    if (isTestGame === 'true') {
                        db.query("INSERT IGNORE INTO TestGames (gameId) VALUES (?)", [id], callback);
                    } else {
                        // Önce medyaları temizle, sonra test kaydını sil
                        db.query("DELETE FROM TestVideos WHERE gameId = ?", [id], () => {
                            db.query("DELETE FROM TestImages WHERE gameId = ?", [id], () => {
                                db.query("DELETE FROM TestGames WHERE gameId = ?", [id], callback);
                            });
                        });
                    }
                } else {
                    callback(null);
                }
            };

            // 4. YENİ GALERİ RESİMLERİNİ EKLE
            const addGallery = (callback) => {
                if (newGallery.length > 0) {
                    const values = newGallery.map(file => [id, file.filename]);
                    let sqlInsert = type === 'Game'
                        ? "INSERT INTO GameImages (gameID, image) VALUES ?"
                        : "INSERT INTO AssetImages (assetID, image) VALUES ?";
                    db.query(sqlInsert, [values], callback);
                } else {
                    callback(null);
                }
            };

            // ZİNCİRLEME İŞLEMLER
            processDeletions((err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: "Silme hatası" }));
                
                processTestProgram((err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: "Test programı hatası" }));

                    addGallery((err) => {
                        if (err) return db.rollback(() => res.status(500).json({ error: "Ekleme hatası" }));

                        db.commit((err) => {
                            if (err) return db.rollback(() => res.status(500).json(err));
                            res.json({ status: "Success", message: "Güncelleme başarılı!" });
                        });
                    });
                });
            });
        });
    });
});

app.delete('/api/delete-item', (req, res) => {
    const { type, id } = req.body;
    db.beginTransaction((err) => {
        if (err) return res.status(500).json(err);

        // 1. ÖNCE DOSYA İSİMLERİNİ ÇEK VE SİL (Sistem Temizliği)
        let sqlGetFiles = type === 'Game'
            ? "SELECT gameImage as cover, gameFile as file FROM Games WHERE gamesID = ?; SELECT image FROM GameImages WHERE gameID = ?"
            : "SELECT assetImage as cover, assetFile as file FROM Assets WHERE assetID = ?; SELECT image FROM AssetImages WHERE assetID = ?";

        db.query(sqlGetFiles, [id, id], (err, results) => {
            if (err) return db.rollback(() => res.status(500).json({ error: "Dosya bilgisi alınamadı" }));
            const mainInfo = results[0][0];
            const galleryImages = results[1];
            if (mainInfo) { deleteFileFromStorage(mainInfo.cover); deleteFileFromStorage(mainInfo.file); }
            if (galleryImages.length > 0) galleryImages.forEach(img => deleteFileFromStorage(img.image));

            // 2. VERİTABANI SİLME İŞLEMLERİ
            if (type === 'Game') {
                db.query("DELETE FROM gametypes_game WHERE game = ?", [id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json(err));
                    db.query("DELETE FROM UserGameDevelops WHERE game = ?", [id], (err) => {
                        if (err) return db.rollback(() => res.status(500).json(err));
                        db.query("DELETE FROM UserByGame WHERE game = ?", [id], (err) => {
                            if (err) return db.rollback(() => res.status(500).json(err));
                            db.query("DELETE FROM GameImages WHERE gameID = ?", [id], (err) => {
                                if (err) return db.rollback(() => res.status(500).json(err));
                                db.query("DELETE FROM Games WHERE gamesID = ?", [id], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json(err));
                                    db.commit((err) => { if (err) return db.rollback(() => res.status(500).json(err)); res.json({ status: "Success", message: "Oyun silindi." }); });
                                });
                            });
                        });
                    });
                });
            } else if (type === 'Asset') {
                db.query("DELETE FROM assettypes_asset WHERE asset = ?", [id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json(err));
                    db.query("DELETE FROM UserAssetDevelops WHERE asset = ?", [id], (err) => {
                        if (err) return db.rollback(() => res.status(500).json(err));
                        db.query("DELETE FROM UserByAsset WHERE asset = ?", [id], (err) => {
                            if (err) return db.rollback(() => res.status(500).json(err));
                            db.query("DELETE FROM AssetImages WHERE assetID = ?", [id], (err) => {
                                if (err) return db.rollback(() => res.status(500).json(err));
                                db.query("DELETE FROM Assets WHERE assetID = ?", [id], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json(err));
                                    db.commit((err) => { if (err) return db.rollback(() => res.status(500).json(err)); res.json({ status: "Success", message: "Asset silindi." }); });
                                });
                            });
                        });
                    });
                });
            }
        });
    });
});

app.get('/api/game-comments/:gameID', (req, res) => {
    const sql = `SELECT GC.*, U.userName FROM GameComments GC JOIN User U ON GC.userID = U.userID WHERE GC.gameID = ? ORDER BY GC.commentDate DESC`;
    db.query(sql, [req.params.gameID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.post('/api/add-game-comment', (req, res) => {
    const { gameID, userID, commentText } = req.body;
    const sql = "INSERT INTO GameComments (gameID, userID, commentText) VALUES (?, ?, ?)";
    db.query(sql, [gameID, userID, commentText], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: "Success", message: "Yorum eklendi" });
    });
});

app.get('/api/asset-comments/:assetID', (req, res) => {
    const sql = `SELECT AC.*, U.userName FROM AssetComments AC JOIN User U ON AC.userID = U.userID WHERE AC.assetID = ? ORDER BY AC.commentDate DESC`;
    db.query(sql, [req.params.assetID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.post('/api/add-asset-comment', (req, res) => {
    const { assetID, userID, commentText } = req.body;
    const sql = "INSERT INTO AssetComments (assetID, userID, commentText) VALUES (?, ?, ?)";
    db.query(sql, [assetID, userID, commentText], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: "Success", message: "Yorum eklendi" });
    });
});

app.post('/api/buy-game', (req, res) => {
    const { userID, gameID, price } = req.body;

    // 1. Kendi oyunu mu kontrolü
    db.query("SELECT * FROM UserGameDevelops WHERE user = ? AND game = ?", [userID, gameID], (err, devRes) => {
        if (err) return res.status(500).json({ message: "Sunucu hatası." });
        if (devRes.length > 0) return res.status(400).json({ message: "Kendi geliştirdiğiniz oyunu satın alamazsınız." });

        // 2. Zaten kütüphanede var mı kontrolü
        db.query("SELECT * FROM userbygame WHERE user = ? AND game = ?", [userID, gameID], (err, libRes) => {
            if (err) return res.status(500).json({ message: "Sunucu hatası." });
            if (libRes.length > 0) return res.status(400).json({ message: "Bu oyun zaten kütüphanenizde mevcut." });

            // 3. Satın almayı gerçekleştir
            const sql = "INSERT INTO userbygame (user, game, price, purchaseDate) VALUES (?, ?, ?, NOW())";
            db.query(sql, [userID, gameID, price], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                return res.json({ status: "Success", message: "Oyun kütüphaneye eklendi." });
            });
        });
    });
});

app.post('/api/buy-asset', (req, res) => {
    const { userID, assetID, price } = req.body;

    // 1. Kendi asseti mi kontrolü
    db.query("SELECT * FROM UserAssetDevelops WHERE user = ? AND asset = ?", [userID, assetID], (err, devRes) => {
        if (err) return res.status(500).json({ message: "Sunucu hatası." });
        if (devRes.length > 0) return res.status(400).json({ message: "Kendi geliştirdiğiniz asseti satın alamazsınız." });

        // 2. Zaten kütüphanede var mı kontrolü
        db.query("SELECT * FROM userbyasset WHERE user = ? AND asset = ?", [userID, assetID], (err, libRes) => {
            if (err) return res.status(500).json({ message: "Sunucu hatası." });
            if (libRes.length > 0) return res.status(400).json({ message: "Bu asset zaten kütüphanenizde mevcut." });

            // 3. Satın almayı gerçekleştir
            const sql = "INSERT INTO userbyasset (user, asset, price, purchaseDate) VALUES (?, ?, ?, NOW())";
            db.query(sql, [userID, assetID, price], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                return res.json({ status: "Success", message: "Asset kütüphaneye eklendi." });
            });
        });
    });
});

app.get('/api/dashboard-stats/:userID', (req, res) => {
    const userID = req.params.userID;
    const sql = `
        SELECT DATE_FORMAT(purchaseDate, '%Y-%m-%d') as saleDate, COUNT(*) as count 
        FROM (
            SELECT purchaseDate FROM userbygame UBG JOIN Games G ON UBG.game = G.gamesID JOIN UserGameDevelops UGD ON G.gamesID = UGD.game WHERE UGD.user = ?
            UNION ALL
            SELECT purchaseDate FROM userbyasset UBA JOIN Assets A ON UBA.asset = A.assetID JOIN UserAssetDevelops UAD ON A.assetID = UAD.asset WHERE UAD.user = ?
        ) as AllSales
        GROUP BY saleDate ORDER BY saleDate ASC
    `;
    db.query(sql, [userID, userID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.get('/api/item-sales-details', (req, res) => {
    const { type, id } = req.query;
    let sql = "";
    if (type === 'Game') {
        sql = `SELECT U.userName as buyerName, UBG.purchaseDate, UBG.price FROM userbygame UBG JOIN user U ON UBG.user = U.userID WHERE UBG.game = ? ORDER BY UBG.purchaseDate DESC`;
    } else {
        sql = `SELECT U.userName as buyerName, UBA.purchaseDate, UBA.price FROM userbyasset UBA JOIN user U ON UBA.user = U.userID WHERE UBA.asset = ? ORDER BY UBA.purchaseDate DESC`;
    }
    db.query(sql, [id], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.get('/api/publisher-total-stats/:userID', (req, res) => {
    const userID = req.params.userID;
    const sql = `
        SELECT G.gameName as name, (SELECT COUNT(*) FROM userbygame WHERE game = G.gamesID) as totalDownloads, 'Oyun' as type
        FROM games G JOIN usergamedevelops UGD ON G.gamesID = UGD.game WHERE UGD.user = ?
        UNION ALL
        SELECT A.assetName as name, (SELECT COUNT(*) FROM userbyasset WHERE asset = A.assetID) as totalDownloads, 'Asset' as type
        FROM assets A JOIN userassetdevelops UAD ON A.assetID = UAD.asset WHERE UAD.user = ?
    `;
    db.query(sql, [userID, userID], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});


// Dashboard'da kullanıcının "Test Programındaki" oyunlarını getiren API
app.get('/api/my-test-games/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT g.gamesID as id, g.gameName, g.gameImage as gameCover 
    FROM Games g
    JOIN TestGames tg ON g.gamesID = tg.gameId
    JOIN UserGameDevelops ugd ON g.gamesID = ugd.game
    WHERE ugd.user = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Test oyunları çekilirken hata:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 2. Belirli bir test oyununun Video ve Fotoğraflarını getiren API
app.get('/api/test-media/:gameId', (req, res) => {
    const gameId = req.params.gameId;

    const videoQuery = "SELECT id, videoPath, createdAt FROM TestVideos WHERE gameId = ?";
    const imageQuery = "SELECT id, imagePath, createdAt FROM TestImages WHERE gameId = ?";

    db.query(videoQuery, [gameId], (err, videoResults) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(imageQuery, [gameId], (err, imageResults) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                videos: videoResults,
                images: imageResults
            });
        });
    });
});

app.listen(3001, () => {
    console.log("Sunucu 3001 portunda çalışıyor...");
});