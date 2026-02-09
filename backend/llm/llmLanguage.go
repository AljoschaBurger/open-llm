package llm

type LanguageType string

const exception = " unless I tell you to use another language"

const (
	LanguageDefault  LanguageType = "Use only the english language to awnser" + exception
	LanguageGerman   LanguageType = "Use only the german language to awnser" + exception
	LanguageEnglisch LanguageType = "Use only the english language to awnser" + exception
)
