package database

import (
	"log"
	"strings"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Initialize initializes the database connection and runs migrations
func Initialize(databaseURL string) (*gorm.DB, error) {
	// Configure GORM logger
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Open database connection - support both PostgreSQL and SQLite
	var db *gorm.DB
	var err error

	if strings.HasPrefix(databaseURL, "sqlite://") {
		// SQLite database for development
		dbPath := strings.TrimPrefix(databaseURL, "sqlite://")
		log.Printf("📄 Using SQLite database: %s", dbPath)

		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: gormLogger,
			NowFunc: func() time.Time {
				return time.Now().UTC()
			},
		})
	} else {
		// PostgreSQL database for production
		log.Printf("🐘 Using PostgreSQL database")
		db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
			Logger: gormLogger,
			NowFunc: func() time.Time {
				return time.Now().UTC()
			},
		})
	}

	if err != nil {
		return nil, err
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto-migrate models (skip if tables already exist to avoid GORM conflicts)
	if !tableExists(db, "drivers") {
		err = db.AutoMigrate(
			&models.UserAccount{},
			&models.RefreshToken{},
			&models.OTPVerification{},
			&models.Driver{},
			&models.Vehicle{},
			&models.Trip{},
			&models.LocationPing{},
			&models.DriverChangeRequest{},
			&models.FuelEvent{},
			&models.FuelAlert{},
			&models.Upload{},
			&models.AuditLog{},
		)
		if err != nil {
			return nil, err
		}
		log.Println("✅ Database models migrated successfully")
	} else {
		log.Println("✅ Database tables already exist, skipping migration")
	}

	log.Println("✅ Database initialized and migrated successfully")
	return db, nil
}

// tableExists checks if a table exists in the database
func tableExists(db *gorm.DB, tableName string) bool {
	var count int64
	db.Raw("SELECT count(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name = ?", tableName).Scan(&count)
	return count > 0
}

// Health checks database connection
func Health(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}
