$filePath = "d:\newFiori\ZMM_SUPPIV_MAN\controller\S1Custom.controller.js"
$content = Get-Content -Path $filePath -Raw

# Reemplazar sap.ui.define eliminando referencias a mixins
$newContent = $content -replace `
    'sap\.ui\.define\(\["ui/s2p/mm/supplinvoice/manage/s1/controller/FullScreenController","ui/s2p/mm/supplinvoice/manage/s1/utils/Constants","ui/s2p/mm/supplinvoice/manage/s1/utils/CommonHelper","ui/s2p/mm/supplinvoice/manage/s1/utils/ODataHelper","ui/s2p/mm/supp[^,]*linvoice/manage/s1/utils/Conversions","ui/s2p/mm/supplinvoice/manage/s1/utils/MessageHelper","ui/s2p/mm/supplinvoice/manage/s1/utils/types/Numchar",[^]]*"\"ui/s2p/mm/supplinvoice/manage/s1/controller/dialogs/ConfirmInvoice\.controller","ui/s2p/mm/supplinvoice/manage/s1/controller/dialogs/CancelInvoice\.controller","ui/s2p/mm/supplinvoice/manage/s1/controller/dialogs/AdvancedInvoice\.controller","ui/s2p/mm/supplin[^"]*voice/manage/s1/controller/popovers/ShareInvoice\.controller","sap/m/MessageBox","sap/base/util/UriParameters"\]\s*,\s*function\([^)]*\)', `
    'sap.ui.define(["ui/s2p/mm/supplinvoice/manage/s1/controller/FullScreenController","ui/s2p/mm/supplinvoice/manage/s1/utils/Constants","ui/s2p/mm/supplinvoice/manage/s1/utils/CommonHelper","ui/s2p/mm/supplinvoice/manage/s1/utils/ODataHelper","ui/s2p/mm/supplinvoice/manage/s1/utils/Conversions","ui/s2p/mm/supplinvoice/manage/s1/utils/MessageHelper","ui/s2p/mm/supplinvoice/manage/s1/utils/types/Numchar","ui/s2p/mm/supplinvoice/manage/s1/controller/dialogs/ConfirmInvoice.controller","ui/s2p/mm/supplinvoice/manage/s1/controller/dialogs/CancelInvoice.controller","ui/s2p/mm/supplinvoice/manage/s1/controller/dialogs/AdvancedInvoice.controller","ui/s2p/mm/supplinvoice/manage/s1/controller/popovers/ShareInvoice.controller","sap/m/MessageBox","sap/base/util/UriParameters"], function(e,t,a,s,o,i,r,f,S,P,E,C,b)'

Set-Content -Path $filePath -Value $newContent
Write-Host "Archivo actualizado correctamente"
