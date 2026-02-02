$path = "c:\Users\FamilyPC\Documents\miraclegreens\v0-miraclegreens\v0-miraclegreens\components\recipe\ingredient-builder.tsx"
$content = Get-Content $path -Raw
# Replace the line that starts with '                                                                <div className="flex items-baseline gap-1">'
$oldLineRegex = '(?m)^\s+<div className="flex items-baseline gap-1"><span className="text-lg font-bold">\{val\.toFixed\(1\)\}</span><span className=\{cn\("text-\[10px\] font-bold", \(label === ''Vitamin D''\) \? "text-amber-600 dark:text-amber-400" : \(label\.includes\(''Folate''\) \|\| label\.includes\(''Selenium''\) \|\| label\.includes\(''Iodine''\) \|\| label\.includes\(''B12''\) \|\| label === ''Vitamin A'' \|\| label === ''Vitamin K''\) \? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"\)\}>\{\(label === ''Vitamin D''\) \? ''IU'' : \(label\.includes\(''Folate''\) \|\| label\.includes\(''Selenium''\) \|\| label\.includes\(''Iodine''\) \|\| label\.includes\(''B12''\) \|\| label === ''Vitamin A'' \|\| label === ''Vitamin K''\) \? ''.*?g'' : ''mg''\}</span></div>'

$newLine = '                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold">
                                                                        {nutrientDisplayMode === "percentage" && pct !== null && !forceRaw ? `${pct}%` : (val >= 1 ? val.toFixed(1) : val.toFixed(2))}
                                                                    </span>
                                                                    {(nutrientDisplayMode !== "percentage" || forceRaw) && (
                                                                        <span className={cn("text-[10px] font-black", (label === "Vitamin D") ? "text-amber-600 dark:text-amber-400" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                                                                            {(label === "Vitamin D") ? "IU" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "µg" : "mg"}
                                                                        </span>
                                                                    )}
                                                                </div>'

$content = $content -replace $oldLineRegex, $newLine

# Also fix the unitLabel issue in the following block
$content = $content -replace 'Target: \{rda\}\{unitLabel \|\| ''''\}', 'Target: {rda}{(label === "Vitamin D") ? "IU" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "µg" : "mg"}'

Set-Content $path $content -NoNewline
