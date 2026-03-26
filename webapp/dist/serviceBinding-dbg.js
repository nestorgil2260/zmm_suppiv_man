function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZMM_POPUP_4170V2_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}