package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// LocalizationService handles multi-language support for FleetFlow
type LocalizationService struct {
	translations   map[string]map[string]interface{}
	defaultLang    string
	supportedLangs []string
	mu             sync.RWMutex
	logger         Logger
}

// SupportedLanguage represents a supported language configuration
type SupportedLanguage struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	NativeName   string `json:"native_name"`
	Direction    string `json:"direction"` // ltr or rtl
	DateFormat   string `json:"date_format"`
	TimeFormat   string `json:"time_format"`
	Currency     string `json:"currency"`
	NumberFormat string `json:"number_format"`
	Enabled      bool   `json:"enabled"`
}

// LocalizationConfig contains configuration for the localization service
type LocalizationConfig struct {
	DefaultLanguage    string              `json:"default_language"`
	SupportedLanguages []SupportedLanguage `json:"supported_languages"`
	TranslationPath    string              `json:"translation_path"`
	AutoDetect         bool                `json:"auto_detect"`
	CacheEnabled       bool                `json:"cache_enabled"`
	ReloadInterval     time.Duration       `json:"reload_interval"`
}

// TranslationRequest represents a request for translation
type TranslationRequest struct {
	Key      string                 `json:"key"`
	Language string                 `json:"language"`
	Params   map[string]interface{} `json:"params,omitempty"`
	Fallback string                 `json:"fallback,omitempty"`
}

// TranslationResponse represents the response with translated text
type TranslationResponse struct {
	Text     string `json:"text"`
	Language string `json:"language"`
	Key      string `json:"key"`
	Found    bool   `json:"found"`
}

// BulkTranslationRequest for translating multiple keys at once
type BulkTranslationRequest struct {
	Keys     []string               `json:"keys"`
	Language string                 `json:"language"`
	Params   map[string]interface{} `json:"params,omitempty"`
}

// BulkTranslationResponse contains multiple translations
type BulkTranslationResponse struct {
	Translations map[string]string `json:"translations"`
	Language     string            `json:"language"`
	Missing      []string          `json:"missing,omitempty"`
}

// NewLocalizationService creates a new localization service
func NewLocalizationService(config LocalizationConfig, logger Logger) (*LocalizationService, error) {
	ls := &LocalizationService{
		translations:   make(map[string]map[string]interface{}),
		defaultLang:    config.DefaultLanguage,
		supportedLangs: make([]string, 0),
		logger:         logger,
	}

	// Extract supported language codes
	for _, lang := range config.SupportedLanguages {
		if lang.Enabled {
			ls.supportedLangs = append(ls.supportedLangs, lang.Code)
		}
	}

	// Load translations
	if err := ls.LoadTranslations(config.TranslationPath); err != nil {
		return nil, fmt.Errorf("failed to load translations: %w", err)
	}

	// Start auto-reload if enabled
	if config.ReloadInterval > 0 {
		go ls.startAutoReload(config.TranslationPath, config.ReloadInterval)
	}

	return ls, nil
}

// LoadTranslations loads all translation files from the specified path
func (ls *LocalizationService) LoadTranslations(translationPath string) error {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	ls.logger.Info("Loading translations from:", translationPath)

	// Check if path exists
	if _, err := os.Stat(translationPath); os.IsNotExist(err) {
		return fmt.Errorf("translation path does not exist: %s", translationPath)
	}

	// Load single file if it's a JSON file
	if strings.HasSuffix(translationPath, ".json") {
		return ls.loadSingleFile(translationPath)
	}

	// Load all JSON files from directory
	return filepath.WalkDir(translationPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() || !strings.HasSuffix(path, ".json") {
			return nil
		}

		return ls.loadTranslationFile(path)
	})
}

// loadSingleFile loads translations from a single JSON file containing all languages
func (ls *LocalizationService) loadSingleFile(filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read translation file %s: %w", filePath, err)
	}

	var allTranslations map[string]map[string]interface{}
	if err := json.Unmarshal(data, &allTranslations); err != nil {
		return fmt.Errorf("failed to parse translation file %s: %w", filePath, err)
	}

	for lang, translations := range allTranslations {
		ls.translations[lang] = translations
		ls.logger.Info("Loaded translations for language:", lang)
	}

	return nil
}

// loadTranslationFile loads translations from a single language file
func (ls *LocalizationService) loadTranslationFile(filePath string) error {
	// Extract language code from filename (e.g., "en.json" -> "en")
	filename := filepath.Base(filePath)
	langCode := strings.TrimSuffix(filename, filepath.Ext(filename))

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read translation file %s: %w", filePath, err)
	}

	var translations map[string]interface{}
	if err := json.Unmarshal(data, &translations); err != nil {
		return fmt.Errorf("failed to parse translation file %s: %w", filePath, err)
	}

	ls.translations[langCode] = translations
	ls.logger.Info("Loaded translations for language:", langCode)

	return nil
}

// Translate translates a single key to the specified language
func (ls *LocalizationService) Translate(ctx context.Context, req TranslationRequest) (*TranslationResponse, error) {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	// Use default language if not specified
	if req.Language == "" {
		req.Language = ls.defaultLang
	}

	// Check if language is supported
	if !ls.isLanguageSupported(req.Language) {
		req.Language = ls.defaultLang
	}

	text, found := ls.getTranslation(req.Key, req.Language, req.Params)

	// Try fallback language if translation not found
	if !found && req.Language != ls.defaultLang {
		text, found = ls.getTranslation(req.Key, ls.defaultLang, req.Params)
	}

	// Use fallback text if provided and translation still not found
	if !found && req.Fallback != "" {
		text = req.Fallback
		found = true
	}

	// Use key as text if still not found
	if !found {
		text = req.Key
	}

	return &TranslationResponse{
		Text:     text,
		Language: req.Language,
		Key:      req.Key,
		Found:    found,
	}, nil
}

// TranslateBulk translates multiple keys at once
func (ls *LocalizationService) TranslateBulk(ctx context.Context, req BulkTranslationRequest) (*BulkTranslationResponse, error) {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	// Use default language if not specified
	if req.Language == "" {
		req.Language = ls.defaultLang
	}

	// Check if language is supported
	if !ls.isLanguageSupported(req.Language) {
		req.Language = ls.defaultLang
	}

	result := &BulkTranslationResponse{
		Translations: make(map[string]string),
		Language:     req.Language,
		Missing:      make([]string, 0),
	}

	for _, key := range req.Keys {
		text, found := ls.getTranslation(key, req.Language, req.Params)

		// Try fallback language if translation not found
		if !found && req.Language != ls.defaultLang {
			text, found = ls.getTranslation(key, ls.defaultLang, req.Params)
		}

		if found {
			result.Translations[key] = text
		} else {
			result.Missing = append(result.Missing, key)
			result.Translations[key] = key // Use key as fallback
		}
	}

	return result, nil
}

// GetSupportedLanguages returns list of supported languages
func (ls *LocalizationService) GetSupportedLanguages() []string {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	return append([]string(nil), ls.supportedLangs...)
}

// GetAvailableLanguages returns all languages with loaded translations
func (ls *LocalizationService) GetAvailableLanguages() []string {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	languages := make([]string, 0, len(ls.translations))
	for lang := range ls.translations {
		languages = append(languages, lang)
	}

	return languages
}

// DetectLanguage attempts to detect language from user preference or request headers
func (ls *LocalizationService) DetectLanguage(acceptLanguage string, userPreference string) string {
	// Use user preference if available and supported
	if userPreference != "" && ls.isLanguageSupported(userPreference) {
		return userPreference
	}

	// Parse Accept-Language header
	if acceptLanguage != "" {
		languages := ls.parseAcceptLanguage(acceptLanguage)
		for _, lang := range languages {
			if ls.isLanguageSupported(lang) {
				return lang
			}
		}
	}

	// Return default language
	return ls.defaultLang
}

// ValidateTranslations checks for missing translations across languages
func (ls *LocalizationService) ValidateTranslations() map[string][]string {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	missing := make(map[string][]string)

	// Get all keys from default language
	defaultKeys := ls.getAllKeys(ls.translations[ls.defaultLang], "")

	// Check each supported language
	for _, lang := range ls.supportedLangs {
		if lang == ls.defaultLang {
			continue
		}

		langTranslations, exists := ls.translations[lang]
		if !exists {
			missing[lang] = defaultKeys
			continue
		}

		langKeys := ls.getAllKeys(langTranslations, "")

		// Find missing keys
		for _, key := range defaultKeys {
			if !ls.containsKey(langKeys, key) {
				missing[lang] = append(missing[lang], key)
			}
		}
	}

	return missing
}

// ExportTranslations exports translations for a specific language
func (ls *LocalizationService) ExportTranslations(language string) (map[string]interface{}, error) {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	translations, exists := ls.translations[language]
	if !exists {
		return nil, fmt.Errorf("translations not found for language: %s", language)
	}

	// Deep copy to prevent modifications
	return ls.deepCopyMap(translations), nil
}

// AddTranslation adds or updates a translation
func (ls *LocalizationService) AddTranslation(language, key, value string) error {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	if ls.translations[language] == nil {
		ls.translations[language] = make(map[string]interface{})
	}

	ls.setNestedValue(ls.translations[language], key, value)
	ls.logger.Info("Added translation:", language, key, value)

	return nil
}

// RemoveTranslation removes a translation
func (ls *LocalizationService) RemoveTranslation(language, key string) error {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	translations, exists := ls.translations[language]
	if !exists {
		return fmt.Errorf("language not found: %s", language)
	}

	ls.deleteNestedValue(translations, key)
	ls.logger.Info("Removed translation:", language, key)

	return nil
}

// GetTranslationStats returns statistics about loaded translations
func (ls *LocalizationService) GetTranslationStats() map[string]interface{} {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	stats := map[string]interface{}{
		"total_languages":     len(ls.translations),
		"default_language":    ls.defaultLang,
		"supported_languages": ls.supportedLangs,
		"languages":           make(map[string]int),
	}

	for lang, translations := range ls.translations {
		stats["languages"].(map[string]int)[lang] = ls.countKeys(translations)
	}

	return stats
}

// Helper methods

func (ls *LocalizationService) getTranslation(key, language string, params map[string]interface{}) (string, bool) {
	translations, exists := ls.translations[language]
	if !exists {
		return "", false
	}

	value := ls.getNestedValue(translations, key)
	if value == nil {
		return "", false
	}

	text, ok := value.(string)
	if !ok {
		return "", false
	}

	// Apply parameter substitution
	if params != nil {
		text = ls.substituteParams(text, params)
	}

	return text, true
}

func (ls *LocalizationService) getNestedValue(data map[string]interface{}, key string) interface{} {
	keys := strings.Split(key, ".")
	var current interface{} = data

	for _, k := range keys {
		switch v := current.(type) {
		case map[string]interface{}:
			current = v[k]
		default:
			return nil
		}

		if current == nil {
			return nil
		}
	}

	return current
}

func (ls *LocalizationService) setNestedValue(data map[string]interface{}, key string, value string) {
	keys := strings.Split(key, ".")
	current := data

	for i, k := range keys {
		if i == len(keys)-1 {
			current[k] = value
		} else {
			if _, exists := current[k]; !exists {
				current[k] = make(map[string]interface{})
			}
			current = current[k].(map[string]interface{})
		}
	}
}

func (ls *LocalizationService) deleteNestedValue(data map[string]interface{}, key string) {
	keys := strings.Split(key, ".")
	current := data

	for i, k := range keys {
		if i == len(keys)-1 {
			delete(current, k)
		} else {
			if next, exists := current[k]; exists {
				current = next.(map[string]interface{})
			} else {
				return
			}
		}
	}
}

func (ls *LocalizationService) substituteParams(text string, params map[string]interface{}) string {
	for key, value := range params {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		text = strings.ReplaceAll(text, placeholder, replacement)
	}
	return text
}

func (ls *LocalizationService) isLanguageSupported(language string) bool {
	for _, supported := range ls.supportedLangs {
		if supported == language {
			return true
		}
	}
	return false
}

func (ls *LocalizationService) parseAcceptLanguage(acceptLanguage string) []string {
	languages := make([]string, 0)

	// Simple parsing of Accept-Language header
	// Format: "en-US,en;q=0.9,hi;q=0.8"
	parts := strings.Split(acceptLanguage, ",")

	for _, part := range parts {
		lang := strings.TrimSpace(part)
		// Remove quality values (;q=0.9)
		if idx := strings.Index(lang, ";"); idx > 0 {
			lang = lang[:idx]
		}
		// Extract primary language code
		if idx := strings.Index(lang, "-"); idx > 0 {
			lang = lang[:idx]
		}

		if lang != "" {
			languages = append(languages, lang)
		}
	}

	return languages
}

func (ls *LocalizationService) getAllKeys(data map[string]interface{}, prefix string) []string {
	keys := make([]string, 0)

	for key, value := range data {
		fullKey := key
		if prefix != "" {
			fullKey = prefix + "." + key
		}

		if subMap, ok := value.(map[string]interface{}); ok {
			keys = append(keys, ls.getAllKeys(subMap, fullKey)...)
		} else {
			keys = append(keys, fullKey)
		}
	}

	return keys
}

func (ls *LocalizationService) containsKey(keys []string, key string) bool {
	for _, k := range keys {
		if k == key {
			return true
		}
	}
	return false
}

func (ls *LocalizationService) countKeys(data map[string]interface{}) int {
	count := 0
	for _, value := range data {
		if subMap, ok := value.(map[string]interface{}); ok {
			count += ls.countKeys(subMap)
		} else {
			count++
		}
	}
	return count
}

func (ls *LocalizationService) deepCopyMap(original map[string]interface{}) map[string]interface{} {
	copy := make(map[string]interface{})

	for key, value := range original {
		if subMap, ok := value.(map[string]interface{}); ok {
			copy[key] = ls.deepCopyMap(subMap)
		} else {
			copy[key] = value
		}
	}

	return copy
}

func (ls *LocalizationService) startAutoReload(translationPath string, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		ls.logger.Info("Auto-reloading translations...")
		if err := ls.LoadTranslations(translationPath); err != nil {
			ls.logger.Error("Failed to reload translations:", err)
		}
	}
}

// RegionalFormat provides region-specific formatting
type RegionalFormat struct {
	Language       string `json:"language"`
	DateFormat     string `json:"date_format"`
	TimeFormat     string `json:"time_format"`
	CurrencyCode   string `json:"currency_code"`
	CurrencySymbol string `json:"currency_symbol"`
	NumberFormat   string `json:"number_format"`
	Direction      string `json:"direction"`
}

// GetRegionalFormat returns formatting preferences for a language/region
func (ls *LocalizationService) GetRegionalFormat(language string) *RegionalFormat {
	// Default formats
	formats := map[string]*RegionalFormat{
		"en": {
			Language:       "en",
			DateFormat:     "02/01/2006",
			TimeFormat:     "15:04",
			CurrencyCode:   "INR",
			CurrencySymbol: "₹",
			NumberFormat:   "1,234.56",
			Direction:      "ltr",
		},
		"hi": {
			Language:       "hi",
			DateFormat:     "02/01/2006",
			TimeFormat:     "15:04",
			CurrencyCode:   "INR",
			CurrencySymbol: "₹",
			NumberFormat:   "1,23,456.78", // Indian numbering
			Direction:      "ltr",
		},
		"ta": {
			Language:       "ta",
			DateFormat:     "02/01/2006",
			TimeFormat:     "15:04",
			CurrencyCode:   "INR",
			CurrencySymbol: "₹",
			NumberFormat:   "1,23,456.78",
			Direction:      "ltr",
		},
		"te": {
			Language:       "te",
			DateFormat:     "02/01/2006",
			TimeFormat:     "15:04",
			CurrencyCode:   "INR",
			CurrencySymbol: "₹",
			NumberFormat:   "1,23,456.78",
			Direction:      "ltr",
		},
		"mr": {
			Language:       "mr",
			DateFormat:     "02/01/2006",
			TimeFormat:     "15:04",
			CurrencyCode:   "INR",
			CurrencySymbol: "₹",
			NumberFormat:   "1,23,456.78",
			Direction:      "ltr",
		},
	}

	if format, exists := formats[language]; exists {
		return format
	}

	// Return English as default
	return formats["en"]
}
