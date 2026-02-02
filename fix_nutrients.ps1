$path = "c:\Users\FamilyPC\Documents\miraclegreens\v0-miraclegreens\v0-miraclegreens\components\recipe\ingredient-builder.tsx"
$content = Get-Content $path
$newContent = $content | ForEach-Object {
    if ($_ -match '\{pct !== null && !forceRaw && <div className=\{cn\("text-\[10px\] font-black", styles\.text\)\}>\{pct\}%</div>\}') {
        $indent = $_.Substring(0, $_.IndexOf('{'))
        "$indent{pct !== null && !forceRaw && ("
        "$indent    <div className=`"flex flex-col gap-0.5`">"
        "$indent        {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && ("
        "$indent            <div className=`"text-[9px] font-bold text-slate-400 opacity-80`">Target: {rda}{unitLabel || ''}</div>"
        "$indent        )}"
        "$indent        {(nutrientDisplayMode === 'percentage' || nutrientDisplayMode === 'both') && ("
        "$indent            <div className={cn(`"text-[10px] font-black`", styles.text)}>{pct}%</div>"
        "$indent        )}"
        "$indent    </div>"
        "$indent)}"
    } else {
        $_
    }
}
$newContent | Set-Content $path
