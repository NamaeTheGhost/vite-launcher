package htmlopt

import (
	"fmt"
	"net/url"
	"os"
	"sort"
	"strings"

	"roots/internal/types"
	"golang.org/x/net/html"
)

type Result struct {
	FilesProcessed   int
	ModulePreloads   int
	Preconnects      int
	DNSPreretches    int
	BytesSaved       int64
}

type Optimizer struct{}

func New() *Optimizer {
	return &Optimizer{}
}

func (o *Optimizer) OptimizeAll(assets []types.Asset, minify bool) (*Result, error) {
	result := &Result{}

	for _, a := range assets {
		if a.Type != types.AssetHTML {
			continue
		}

		r, err := o.OptimizeFile(a.Path, minify)
		if err != nil {
			return result, fmt.Errorf("html %s: %w", a.Path, err)
		}
		result.FilesProcessed++
		result.ModulePreloads += r.ModulePreloads
		result.Preconnects += r.Preconnects
		result.DNSPreretches += r.DNSPreretches
		result.BytesSaved += r.BytesSaved
	}

	return result, nil
}

type optimizeResult struct {
	ModulePreloads int
	Preconnects    int
	DNSPreretches  int
	BytesSaved     int64
}

func (o *Optimizer) OptimizeFile(path string, minify bool) (*optimizeResult, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	originalSize := int64(len(data))

	doc, err := html.Parse(strings.NewReader(string(data)))
	if err != nil {
		return nil, fmt.Errorf("parse html: %w", err)
	}

	moduleScripts := findModuleScripts(doc)
	externalOrigins := findExternalOrigins(doc)

	preloads := make([]string, 0)
	for _, ms := range moduleScripts {
		preloads = append(preloads, ms)
	}

	preconnects := make([]string, 0)
	dnsPrefetches := make([]string, 0)
	for _, origin := range externalOrigins {
		preconnects = append(preconnects, origin)
		dnsPrefetches = append(dnsPrefetches, origin)
	}

	sort.Strings(preloads)
	sort.Strings(preconnects)
	sort.Strings(dnsPrefetches)

	optimized := injectLinks(string(data), preloads, preconnects, dnsPrefetches)

	if minify {
		optimized = minifyHTML(optimized)
	}

	if err := os.WriteFile(path, []byte(optimized), 0644); err != nil {
		return nil, err
	}

	newSize := int64(len(optimized))

	return &optimizeResult{
		ModulePreloads:   len(preloads),
		Preconnects:      len(preconnects),
		DNSPreretches:    len(dnsPrefetches),
		BytesSaved:       originalSize - newSize,
	}, nil
}

func findModuleScripts(doc *html.Node) []string {
	scripts := make(map[string]bool)

	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "script" {
			var src, typ string
			for _, attr := range n.Attr {
				switch attr.Key {
				case "src":
					src = attr.Val
				case "type":
					typ = attr.Val
				}
			}
			if src != "" && typ == "module" {
				scripts[src] = true
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	result := make([]string, 0, len(scripts))
	for s := range scripts {
		result = append(result, s)
	}
	sort.Strings(result)
	return result
}

func findExternalOrigins(doc *html.Node) []string {
	origins := make(map[string]bool)

	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode {
			var href, src string
			for _, attr := range n.Attr {
				switch attr.Key {
				case "href":
					href = attr.Val
				case "src":
					src = attr.Val
				}
			}

			for _, u := range []string{href, src} {
				if u == "" {
					continue
				}
				parsed, err := url.Parse(u)
				if err != nil {
					continue
				}
				if parsed.Scheme != "" && parsed.Host != "" {
					origin := parsed.Scheme + "://" + parsed.Host
					origins[origin] = true
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	result := make([]string, 0, len(origins))
	for o := range origins {
		result = append(result, o)
	}
	return result
}

func injectLinks(htmlContent string, preloads, preconnects, dnsPrefetches []string) string {
	existingPreloads := extractExistingPreloads(htmlContent)
	preloads = filterExisting(preloads, existingPreloads)

	headEndIdx := strings.Index(htmlContent, "</head>")
	if headEndIdx == -1 {
		headStartIdx := strings.Index(htmlContent, "<head")
		if headStartIdx == -1 {
			bodyIdx := strings.Index(htmlContent, "<body")
			if bodyIdx == -1 {
				return htmlContent
			}
			injected := htmlContent[:bodyIdx] + "<head>\n"
			for _, p := range preloads {
				injected += fmt.Sprintf(`  <link rel="modulepreload" href="%s">`+"\n", p)
			}
			for _, p := range preconnects {
				injected += fmt.Sprintf(`  <link rel="preconnect" href="%s">`+"\n", p)
			}
			for _, p := range dnsPrefetches {
				injected += fmt.Sprintf(`  <link rel="dns-prefetch" href="%s">`+"\n", p)
			}
			injected += "</head>\n"
			injected += htmlContent[bodyIdx:]
			return injected
		}
		headEndIdx = strings.Index(htmlContent[headStartIdx:], ">")
		if headEndIdx == -1 {
			return htmlContent
		}
		headEndIdx = headStartIdx + headEndIdx + 1
		return injectAfterOpeningTag(htmlContent, headEndIdx, preloads, preconnects, dnsPrefetches)
	}

	var sb strings.Builder
	sb.WriteString(htmlContent[:headEndIdx])

	for _, p := range preloads {
		sb.WriteString(fmt.Sprintf(`  <link rel="modulepreload" href="%s">`+"\n", p))
	}
	for _, p := range preconnects {
		sb.WriteString(fmt.Sprintf(`  <link rel="preconnect" href="%s">`+"\n", p))
	}
	for _, p := range dnsPrefetches {
		sb.WriteString(fmt.Sprintf(`  <link rel="dns-prefetch" href="%s">`+"\n", p))
	}

	sb.WriteString(htmlContent[headEndIdx:])
	return sb.String()
}

func extractExistingPreloads(htmlContent string) []string {
	var result []string
	for _, part := range strings.Split(htmlContent, "<link") {
		if !strings.Contains(part, `rel="modulepreload"`) {
			continue
		}
		hrefStart := strings.Index(part, `href="`)
		if hrefStart == -1 {
			continue
		}
		hrefStart += 6
		hrefEnd := strings.Index(part[hrefStart:], `"`)
		if hrefEnd == -1 {
			continue
		}
		result = append(result, part[hrefStart:hrefStart+hrefEnd])
	}
	return result
}

func filterExisting(items, existing []string) []string {
	existingSet := make(map[string]bool, len(existing))
	for _, e := range existing {
		existingSet[e] = true
	}
	var result []string
	for _, item := range items {
		if !existingSet[item] {
			result = append(result, item)
		}
	}
	return result
}

func injectAfterOpeningTag(htmlContent string, afterIdx int, preloads, preconnects, dnsPrefetches []string) string {
	var sb strings.Builder
	sb.WriteString(htmlContent[:afterIdx])
	sb.WriteString("\n")
	for _, p := range preloads {
		sb.WriteString(fmt.Sprintf(`  <link rel="modulepreload" href="%s">`+"\n", p))
	}
	for _, p := range preconnects {
		sb.WriteString(fmt.Sprintf(`  <link rel="preconnect" href="%s">`+"\n", p))
	}
	for _, p := range dnsPrefetches {
		sb.WriteString(fmt.Sprintf(`  <link rel="dns-prefetch" href="%s">`+"\n", p))
	}
	sb.WriteString(htmlContent[afterIdx:])
	return sb.String()
}

func minifyHTML(htmlContent string) string {
	result := htmlContent

	result = strings.ReplaceAll(result, "\n", " ")
	result = strings.ReplaceAll(result, "\r", " ")
	result = strings.ReplaceAll(result, "\t", " ")

	for strings.Contains(result, "  ") {
		result = strings.ReplaceAll(result, "  ", " ")
	}

	result = strings.ReplaceAll(result, "> <", "><")
	result = strings.ReplaceAll(result, "> ", ">")
	result = strings.ReplaceAll(result, " <", "<")

	return result
}


