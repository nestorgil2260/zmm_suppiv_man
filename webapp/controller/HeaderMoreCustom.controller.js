sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment"
], function (C, J, Fragment) {
	"use strict";
	var H = sap.ui.controller("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.controller.HeaderMoreCustom", {
		//    onControlChanged: function (e) {
		//        this.getOwnerComponent().getAppController().getS1Controller().onControlChanged(e);
		//    }

		onInit: function () {
			console.log("HeaderMoreCustom.onInit - START");
			this._ensureStateModel();
			this._attachHeaderViewDelegate();
			this._scheduleHeaderSync();
		},

		_attachHeaderViewDelegate: function () {
			var oView = this.getView && this.getView();

			if (this._bHeaderViewDelegateAttached || !oView || typeof oView.addEventDelegate !== "function") {
				return;
			}

			oView.addEventDelegate({
				onAfterRendering: function () {
					this._syncHeaderFields();
				}
			}, this);

			this._bHeaderViewDelegateAttached = true;
		},

		_scheduleHeaderSync: function () {
			if (this._iInitialHeaderSync) {
				window.clearTimeout(this._iInitialHeaderSync);
			}

			this._iInitialHeaderSync = window.setTimeout(function () {
				this._syncHeaderFields();
			}.bind(this), 0);
		},

		_attachValueHelpFallbackDelegate: function (oInput, sKey, fnHandler) {
			if (!oInput || oInput.data(sKey) || typeof oInput.addEventDelegate !== "function") {
				return;
			}

			oInput.addEventDelegate({
				onsapshow: function (oEvent) {
					fnHandler.call(this, oEvent);
				}
			}, this);

			oInput.data(sKey, "true", true);
		},

		_ensureStateModel: function () {
			var oComponent = this.getOwnerComponent && this.getOwnerComponent();

			if (oComponent && !oComponent.getModel("xrefState")) {
				oComponent.setModel(new J({
					xref2Status: "X"
				}), "xrefState");
			}
		},

		_getStateModel: function () {
			var oComponent = this.getOwnerComponent && this.getOwnerComponent();
			return oComponent ? oComponent.getModel("xrefState") : null;
		},

		_setXref2Status: function (sStatus) {
			var oModel = this._getStateModel();

			if (oModel) {
				oModel.setProperty("/xref2Status", sStatus || "X");
			}
		},

		_collectControlCandidates: function (oControl, aCandidates) {
			var aResult = aCandidates || [];
			var oMetadata;
			var mAggregations;
			var aInnerControls;

			if (!oControl || aResult.indexOf(oControl) !== -1) {
				return aResult;
			}

			aResult.push(oControl);

			if (typeof oControl.getInnerControls === "function") {
				aInnerControls = oControl.getInnerControls() || [];
				aInnerControls.forEach(function (oInnerControl) {
					this._collectControlCandidates(oInnerControl, aResult);
				}.bind(this));
			}

			oMetadata = oControl.getMetadata && oControl.getMetadata();
			mAggregations = oMetadata && oMetadata.getAllAggregations ? oMetadata.getAllAggregations() : null;

			Object.keys(mAggregations || {}).forEach(function (sAggregationName) {
				var oAggregation = mAggregations[sAggregationName];
				var sGetterName = oAggregation && oAggregation._sGetter;
				var vChildren;

				if (!sGetterName || typeof oControl[sGetterName] !== "function") {
					return;
				}

				vChildren = oControl[sGetterName]();

				if (Array.isArray(vChildren)) {
					vChildren.forEach(function (oChild) {
						this._collectControlCandidates(oChild, aResult);
					}.bind(this));
				} else {
					this._collectControlCandidates(vChildren, aResult);
				}
			}.bind(this));

			return aResult;
		},

		_findBestMatchingControl: function (oControl, fnMatcher) {
			var aCandidates = this._collectControlCandidates(oControl, []);

			return aCandidates.find(fnMatcher) || null;
		},

		_getInnerControl: function (oControl) {
			return this._findBestMatchingControl(oControl, function (oCandidate) {
				return !!oCandidate && typeof oCandidate.getValue === "function" && typeof oCandidate.setValue === "function";
			}) || oControl || null;
		},

		_getVisibleControl: function (sId) {
			try {
				var aAllControls = [];
				var $elements = jQuery("[id$='" + sId + "']");
				
				$elements.each(function() {
					var sFullId = this.id;
					var oCtrl = sap.ui.getCore().byId(sFullId);
					if (!oCtrl) { oCtrl = sap.ui.getCore().byId(sFullId.split("-")[0]); }
					if (oCtrl && aAllControls.indexOf(oCtrl) === -1) {
						aAllControls.push(oCtrl);
					}
				});

				// Prioritize the one that is actually visible
				var oVisible = aAllControls.find(function(oCtrl) {
					var bVis = typeof oCtrl.getVisible === "function" ? oCtrl.getVisible() !== false : true;
					return bVis && !!oCtrl.getDomRef();
				});

				return oVisible || aAllControls[0] || null;
			} catch (e) {
				return null;
			}
		},

		_getFieldInput: function (sFieldId) {
			var oView = this.getView();
			var oField = oView.byId(sFieldId) || this._getVisibleControl(sFieldId) || this._getGlobalControl(sFieldId);
			var aCandidates = this._collectControlCandidates(oField, []);
			var aInputCandidates = aCandidates.filter(function (oCandidate) {
				return !!oCandidate && typeof oCandidate.getValue === "function" && typeof oCandidate.setValue === "function";
			});
			var oPreferredWithHandler = aInputCandidates.find(function (oCandidate) {
				var bVisible = typeof oCandidate.getVisible === "function" ? oCandidate.getVisible() !== false : true;
				var bCanAttachHelp = typeof oCandidate.attachValueHelpRequest === "function" || typeof oCandidate.attachEvent === "function";

				return bVisible && bCanAttachHelp;
			});
			var oPreferred = aInputCandidates.find(function (oCandidate) {
				var bVisible = typeof oCandidate.getVisible === "function" ? oCandidate.getVisible() !== false : true;
				var bHasHelpApi = typeof oCandidate.attachValueHelpRequest === "function" || typeof oCandidate.fireValueHelpRequest === "function" || typeof oCandidate.setShowValueHelp === "function";

				return bVisible && bHasHelpApi;
			});

			return oPreferredWithHandler || oPreferred || aInputCandidates[0] || this._getInnerControl(oField);
		},

		_getAssignmentReferenceInput: function () {
			var oInput = this._getFieldInput("idS2P.MM.MSI.InputAssignmentReferenceZ");
			if (!oInput) oInput = this._getFieldInput("idS2P.MM.MSI.InputAssignmentReference");
			if (oInput) {
				console.log("Discovery: AssignmentReference found:", oInput.getId(), "Visible:", (typeof oInput.getVisible === "function" ? oInput.getVisible() : "unknown"));
			}
			return oInput;
		},

		_getAccountingHeaderTextInput: function () {
			var oInput = this._getFieldInput("idS2P.MM.MSI.InputAssignmentReference2Z");
			if (!oInput) oInput = this._getFieldInput("idS2P.MM.MSI.InputAccountingDocumentHeaderText");
			if (oInput) {
				console.log("Discovery: AccountingDocumentHeader found:", oInput.getId(), "Visible:", (typeof oInput.getVisible === "function" ? oInput.getVisible() : "unknown"));
			}
			return oInput;
		},

		_getGlobalControl: function (sId) {
			try {
				var oControl = sap.ui.getCore().byId(sId);
				if (oControl) return oControl;

				var sPrefix = (this.getView()._sOwnerId || "");
				var aPrefixes = [
					sPrefix + "---MMIV_HEADER_ID_S1--idS2P.MM.MSI.HeaderMore-defaultXML--",
					sPrefix + "---MMIV_HEADER_ID_S1--",
					"MMIV_HEADER_ID_S1--idS2P.MM.MSI.HeaderMore-defaultXML--",
					"MMIV_HEADER_ID_S1--"
				];

				for (var i = 0; i < aPrefixes.length; i++) {
					oControl = sap.ui.getCore().byId(aPrefixes[i] + sId);
					if (oControl) return oControl;
				}
				return null;
			} catch (e) {
				console.error("Error in _getGlobalControl", e);
				return null;
			}
		},

		_getCompanyCodeValue: function () {
			var oCompanyCode = this._getGlobalControl("idS2P.MM.MSI.CEInputCompanyCode");
			if (oCompanyCode && typeof oCompanyCode.getValue !== "function" && typeof oCompanyCode.getInnerControls === "function") {
				// If we found a wrapper/Grid, try to find the actual input inside
				oCompanyCode = this._findBestMatchingControl(oCompanyCode, function(oCandidate) {
					return !!oCandidate && typeof oCandidate.getValue === "function";
				});
			}
			return (oCompanyCode && typeof oCompanyCode.getValue === "function") ? oCompanyCode.getValue() : "";
		},

		_getPostingYear: function () {
			var oPostingDate = this._getGlobalControl("idS2P.MM.MSI.CEDatePickerPostingDate");
			var oDatePicker = oPostingDate && typeof oPostingDate.getContent === "function" ? oPostingDate.getContent()[0] : null;
			var oDateValue = oDatePicker && typeof oDatePicker.getDateValue === "function" ? oDatePicker.getDateValue() : null;

			return oDateValue ? oDateValue.getFullYear() : "";
		},

		_getGrossAmountValue: function () {
			var oGrossAmount = this._getGlobalControl("idS2P.MM.MSI.CEInputInvoiceGrossAmount");
			var sVal = oGrossAmount ? oGrossAmount.getValue() : "";
			return sVal ? String(sVal).split(".").join("") : "";
		},

		_getGrossAmountCurrency: function () {
			var oGrossAmountCurrency = this._getGlobalControl("idS2P.MM.MSI.CEInputInvoiceGrossAmount-sfEdit");
			var sVal = oGrossAmountCurrency ? oGrossAmountCurrency.getValue() : "";
			return sVal ? String(sVal) : "";
		},

		_getExchangeRateValue: function () {
			var oExchangeRate = this._getGlobalControl("idS2P.MM.MSI.InputExchangeRate");
			if (oExchangeRate && typeof oExchangeRate.getValue !== "function") {
				oExchangeRate = this._findBestMatchingControl(oExchangeRate, function(oCandidate) {
					return !!oCandidate && typeof oCandidate.getValue === "function";
				});
			}
			var sVal = (oExchangeRate && typeof oExchangeRate.getValue === "function") ? oExchangeRate.getValue() : "";
			return sVal ? String(sVal) : "";
		},

		_getSupplierInvoice: function () {
			var sSupplierInvoice = window.location.href.substr(window.location.href.search("SupplierInvoice=") + 16, 10);

			return isNaN(sSupplierInvoice) ? "" : sSupplierInvoice;
		},

		_wireInputOnce: function (oInput, sKey, fnCallback) {
			var bAttached;

			if (!oInput || oInput.data(sKey)) {
				return;
			}

			bAttached = fnCallback(oInput);

			if (bAttached !== false) {
				oInput.data(sKey, "true", true);
			}
		},

		_handleAmountChange: function () {
			var oCompanyCode = this._getCompanyCodeValue();
			var oXref2 = this._getAccountingHeaderTextInput();

			if (oCompanyCode === "3000" && oXref2) {
				oXref2.setValue("");
				oXref2.data("dato", "", true);
				oXref2.data("noError", "", true);
				this._setXref2Status("");
			}

			this._syncHeaderFields();
		},

		_syncHeaderFields: function () {
			try {
				var oXref1Input = this._getAssignmentReferenceInput();
				var oXref2Input = this._getAccountingHeaderTextInput();
			var oXref1Field = this.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ") || this.getView().byId("idS2P.MM.MSI.InputAssignmentReference");
			var oXref2Field = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference2Z") || this.getView().byId("idS2P.MM.MSI.InputAccountingDocumentHeaderText");
			var oAssignmentLabel = this.getView().byId("label0") || this.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ-label") || this.getView().byId("idS2P.MM.MSI.InputAssignmentReference-label");
			var oHeaderTextLabel = this.getView().byId("label2") || this.getView().byId("idS2P.MM.MSI.InputAssignmentReference2Z-label") || this.getView().byId("idS2P.MM.MSI.InputAccountingDocumentHeaderText-label");
			var oFullScreenModel = this.getView().getModel("fullScreen");
			var sCompanyCode = this._getCompanyCodeValue();
			var oGrossAmount = this._getGlobalControl("idS2P.MM.MSI.CEInputInvoiceGrossAmount");
			var vEditMode = oFullScreenModel ? oFullScreenModel.getProperty("/EditMode") : undefined;
			var bEditable = typeof vEditMode === "boolean" ? vEditMode :
				(vEditMode === "Editable" || vEditMode === "Edit" || (oGrossAmount ? oGrossAmount.getEditable() : true));

			// Debug: Log all view controls
			try {
				console.log("--- VIEW CONTROLS SCAN ---");
				this.getView().findAggregatedObjects(true).forEach(function(o) {
					if (o.getId().indexOf("InputAssignment") !== -1 || o.getId().indexOf("InputAccounting") !== -1) {
						console.log("Found relevant control:", o.getId(), "Visible:", o.getVisible());
					}
				});
			} catch(e) {}


			if (oAssignmentLabel) {
				oAssignmentLabel.setText("XRef1");
				if (typeof oAssignmentLabel.setRequired === "function") {
					oAssignmentLabel.setRequired(true);
				}
			}

			if (oHeaderTextLabel) {
				oHeaderTextLabel.setText("Clave referencia 2");
				if (typeof oHeaderTextLabel.setRequired === "function") {
					oHeaderTextLabel.setRequired(sCompanyCode === "3000");
				}
			}

			if (oXref1Input) {
				// Visibility handled by XML

				if (typeof oXref1Input.setEnabled === "function") {
					oXref1Input.setEnabled(true);
				}
				if (typeof oXref1Input.setRequired === "function") {
					oXref1Input.setRequired(true);
				}
				if (typeof oXref1Input.setShowValueHelp === "function") {
					oXref1Input.setShowValueHelp(true);
				}
				// Force event attachment as backup
				if (typeof oXref1Input.attachValueHelpRequest === "function") {
					oXref1Input.detachValueHelpRequest(this.onValueHelpInputAssignmentReferenceZ, this);
					oXref1Input.attachValueHelpRequest(this.onValueHelpInputAssignmentReferenceZ, this);
				}
				if (typeof oXref1Input.detachEvent === "function" && typeof oXref1Input.attachEvent === "function") {
					oXref1Input.detachEvent("valueHelpRequest", this.onValueHelpInputAssignmentReferenceZ, this);
					oXref1Input.attachEvent("valueHelpRequest", this.onValueHelpInputAssignmentReferenceZ, this);
				}
				if (typeof oXref1Input.setValueHelpOnly === "function") {
					oXref1Input.setValueHelpOnly(false);
				}
				if (typeof oXref1Input.setEditable === "function") {
					oXref1Input.setEditable(true);
				}
				if (typeof oXref1Input.setShowValueHelp === "function") {
					oXref1Input.setShowValueHelp(true);
				}
			}

			if (oXref2Input) {
				// Visibility handled by XML

				if (typeof oXref2Input.setEnabled === "function") {
					oXref2Input.setEnabled(true);
				}
				if (typeof oXref2Input.setShowValueHelp === "function") {
					oXref2Input.setShowValueHelp(true);
				}
				// Force event attachment as backup
				if (typeof oXref2Input.attachValueHelpRequest === "function") {
					oXref2Input.detachValueHelpRequest(this.onSearchXref2, this);
					oXref2Input.attachValueHelpRequest(this.onSearchXref2, this);
				}
				if (typeof oXref2Input.detachEvent === "function" && typeof oXref2Input.attachEvent === "function") {
					oXref2Input.detachEvent("valueHelpRequest", this.onSearchXref2, this);
					oXref2Input.attachEvent("valueHelpRequest", this.onSearchXref2, this);
				}
				if (typeof oXref2Input.setValueHelpOnly === "function") {
					oXref2Input.setValueHelpOnly(true);
				}
				if (typeof oXref2Input.setEditable === "function") {
					oXref2Input.setEditable(true);
				}
				if (typeof oXref2Input.setShowValueHelp === "function") {
					oXref2Input.setShowValueHelp(true);
				}
				this._attachValueHelpFallbackDelegate(oXref2Input, "xref2SapShowAttached", this.onSearchXref2);
			}

			this._wireInputOnce(oGrossAmount, "xrefAmountChangeAttached", function (oInput) {
				if (typeof oInput.attachChange === "function") {
					oInput.attachChange(this._handleAmountChange, this);
				}
			}.bind(this));
		} catch (e) {
			console.error("Error in _syncHeaderFields", e);
		}
		},

		onSearchXref2: function (oEvent) {
			console.log("HeaderMoreCustom.onSearchXref2 - TRIGGERED");
			if (oEvent && oEvent.getSource) {
				console.log("Source ID:", oEvent.getSource().getId());
			}


			var CompanyCode = this._getCompanyCodeValue();
			var FiscalYear = this._getPostingYear();
			var SupplierInvoice = this._getSupplierInvoice();
			var SupplierInvoiceValue = this._getGrossAmountValue();
			var SupplierInvoiceValueCurr = this._getGrossAmountCurrency();
			var tasa = this._getExchangeRateValue();

			var servicio = "/sap/opu/odata/sap/ZMM_SUPPLIER_INVOICE_MANAGE_SRV";
			var ozModel = new sap.ui.model.odata.ODataModel(servicio, true);

			// var sInputValue = oEvent.getSource().getValue();
			var sInputValue = "";
			this.inputId = oEvent.getSource().getId();
			console.log("HeaderMoreCustom.onSearchXref2 inputId:", this.inputId);
			var path;
			var oTableStdListTemplate;
			var oFilterTableNo;
			var fnOpenDialog = function() {
				var path = "/empleadoVHSet";
				var oTableStdListTemplate = new sap.m.StandardListItem({
					title: "{Partner}",
					description: "{Name1Text}"
				}); // //create a filter for the binding
				var oFilterTableNo = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(sInputValue || ""));
				var oFilterCompanyCode = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(CompanyCode || ""));
				var oFilterFiscalYear = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(FiscalYear || ""));
				var oFilterSupplierInvoiceValue = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(SupplierInvoiceValue || ""));
				var oFilterSupplierInvoiceValueCurr = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(SupplierInvoiceValueCurr || ""));
				var oFilterSupplierInvoice = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(SupplierInvoice || ""));
				var oFilterTasa = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(tasa || ""));	

				this.oDialog.unbindAggregation("items");
				this.oDialog.bindAggregation("items", {
					path: path,
					template: oTableStdListTemplate,
					filters: [oFilterTableNo, oFilterCompanyCode, oFilterFiscalYear, oFilterSupplierInvoiceValue, oFilterSupplierInvoiceValueCurr, oFilterSupplierInvoice, oFilterTasa ]
				}); // }// open value help dialog filtered by the input value
				console.log("HeaderMoreCustom: opening oDialog with filter value", sInputValue);
				this.oDialog.open(sInputValue);
			}.bind(this);

			if (!this.oDialog) {
				console.log("HeaderMoreCustom: creating oDialog fragment popUpXref2VH");
				if (sap.ui.core.Fragment && typeof sap.ui.core.Fragment.load === "function") {
					sap.ui.core.Fragment.load({
						name: "ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpXref2VH",
						controller: this
					}).then(function(oDialog){
						console.log("HeaderMoreCustom: oDialog loaded successfully");
						this.oDialog = oDialog;
						this.getView().addDependent(this.oDialog);
						this.oDialog.setModel(ozModel);
						fnOpenDialog();
					}.bind(this)).catch(function(oError){
						console.error("HeaderMoreCustom: Error loading fragment popUpXref2VH", oError);
					});
				} else {
					this.oDialog = sap.ui.xmlfragment(this.getView().getId(), "ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpXref2VH", this);
					this.getView().addDependent(this.oDialog);
					this.oDialog.setModel(ozModel);
					fnOpenDialog();
				}
			} else {
				console.log("HeaderMoreCustom: reusing existing oDialog");
				fnOpenDialog();
			}
		},

		onSearchXref2LiveChange: function (oEvent) {
			console.log("HeaderMoreCustom.onSearchXref2LiveChange called", oEvent && oEvent.getSource ? oEvent.getSource().getId() : oEvent);

			var CompanyCodeInput = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputCompanyCode");
			if (CompanyCodeInput) {
				var CompanyCode = CompanyCodeInput.getValue();
			}
			// var CompanyCode = window.location.href.substr(window.location.href.search("CompanyCode=") + 12,4);
			var FiscalYear = sap.ui.getCore().byId("" + this.getView()._sOwnerId + "---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEDatePickerPostingDate")
				.getContent().getDateValue().getFullYear();
			var SupplierInvoice = window.location.href.substr(window.location.href.search("SupplierInvoice=") + 16, 10);
			
			if (isNaN(SupplierInvoice)){
			 	SupplierInvoice = "";
			 }

			var SupplierInvoiceValue = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount").getValue().split(".").join("");

			var SupplierInvoiceValueCurr = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount-sfEdit").getValue();
				
			// var tasa = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.HeaderMore-defaultXML--idS2P.MM.MSI.InputExchangeRate").getValue().split("/").join("");
			
			var tasa = this._getExchangeRateValue();

			var servicio = "/sap/opu/odata/sap/ZMM_SUPPLIER_INVOICE_MANAGE_SRV";
			var ozModel = new sap.ui.model.odata.ODataModel(servicio, true);

			var sInputValue = sap.ui.getCore().byId(oEvent.getSource().getId() + "-" + "searchField").getValue();
			this.inputId = oEvent.getSource().getId() + "-" + "searchField";
			console.log("HeaderMoreCustom.onSearchXref2LiveChange inputId:", this.inputId, "searchValue:", sInputValue);
			var path;
			var oTableStdListTemplate;
			var oFilterTableNo;
			if (!this.oDialog) {
				// We need to wait for the dialog to be loaded by onSearchXref2 if it doesn't exist yet
				this.onSearchXref2(oEvent);
				return;
			}
			path = "/empleadoVHSet";
			oTableStdListTemplate = new sap.m.StandardListItem({
				title: "{Partner}",
				description: "{Name1Text}"
			}); // //create a filter for the binding
			oFilterTableNo = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, sInputValue);
			var oFilterCompanyCode = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(CompanyCode || ""));
			var oFilterFiscalYear = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(FiscalYear || ""));
			var oFilterSupplierInvoiceValue = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(SupplierInvoiceValue || ""));
			var oFilterSupplierInvoiceValueCurr = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(SupplierInvoiceValueCurr || ""));
			var oFilterSupplierInvoice = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(SupplierInvoice || ""));
			var oFilterTasa = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, String(tasa || ""));	

			this.oDialog.unbindAggregation("items");
			this.oDialog.bindAggregation("items", {
				path: path,
				template: oTableStdListTemplate,
				filters: [oFilterTableNo, oFilterCompanyCode, oFilterFiscalYear, oFilterSupplierInvoiceValue, oFilterSupplierInvoiceValueCurr, oFilterSupplierInvoice, oFilterTasa]
			}); // }// open value help dialog filtered by the input value
			console.log("HeaderMoreCustom: opening oDialog (live change) with value", sInputValue);
		},
		handleTableValueHelpConfirm: function (e) {

			var s = e.getParameter("selectedItem");
			console.log("HeaderMoreCustom.handleTableValueHelpConfirm selectedItem:", s, "inputId:", this.inputId);
			// var CompanyCode = jQuery.sap.getUriParameters().get("CompanyCode");
			var CompanyCode = this._getCompanyCodeValue();
			var FiscalYear = this._getPostingYear();
			// var SupplierInvoiceValue = window.location.href.substr(window.location.href.search("SupplierInvoiceValue=") + 16, 10);

			// var SupplierInvoiceValue = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount").getValue();

			// var SupplierInvoiceValueCurr = 	sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount-sfEdit").getValue();
			if (s) {
				console.log("HeaderMoreCustom.handleTableValueHelpConfirm: selected binding context:", s.getBindingContext() && s.getBindingContext().getObject());

				var xref2 = sap.ui.getCore().byId(this.inputId) || this._getAccountingHeaderTextInput();

				if (CompanyCode && CompanyCode === "3000") {

					if (s.getBindingContext().getObject().BuGroup != "A" && s.getBindingContext().getObject().BuGroup != "B") {
						sap.m.MessageBox.error("El código de cliente interno no es un aprobador válido", {});
						xref2.data("noError", "", true);
						this._setXref2Status("");
						xref2.setValue("");
						xref2.data("dato", "", true);
					} else if (s.getBindingContext().getObject().BuGroup == "B") {
						sap.m.MessageBox.error("El código de cliente int. no es un aprobador válido de acuerdo al monto", {});
						xref2.data("noError", "B", true);
						this._setXref2Status("B");
						xref2.setValue("");
						xref2.data("dato", "", true);
					} else {
						xref2.data("noError", "X", true);
						this._setXref2Status("X");
						xref2.setValue(s.getBindingContext().getObject().Partner);
					}
				} else {
					xref2.data("noError", "X", true);
					this._setXref2Status("X");
					xref2.setValue(s.getBindingContext().getObject().Partner);
				}
				// this.oDialog.close();

				this.onAfterRendering(e);
			}

		},

		handleTableValueHelpCancel: function (e) {
			// this.oDialog.close();

		},

		onAfterRendering: function (oEvent) {
			this._syncHeaderFields();

			if (this._iDeferredSync) {
				window.clearTimeout(this._iDeferredSync);
			}

			this._iDeferredSync = window.setTimeout(function () {
				this._syncHeaderFields();
			}.bind(this), 0);

		},

			onValueHelpInputAssignmentReferenceZ: function (oEvent) {
			console.log("HeaderMoreCustom.onValueHelpInputAssignmentReferenceZ - TRIGGERED");
			var oAssignmentInput = oEvent && oEvent.getSource ? oEvent.getSource() : null;
			var sCompanyCode = this._getCompanyCodeValue();
			var oHelpTable;
			var bSelectionApplied = false;

			oAssignmentInput = this._findBestMatchingControl(oAssignmentInput, function (oCandidate) {
				return !!oCandidate && typeof oCandidate.getValue === "function" && typeof oCandidate.setValue === "function";
			}) || this._getAssignmentReferenceInput();

			var fnApplySelection = function () {
				if (bSelectionApplied || !oHelpTable) {
					return;
				}

				var oContext = oHelpTable.getContextByIndex(oHelpTable.getSelectedIndex());

				if (oContext && oAssignmentInput) {
					var oSel = oContext.getModel().getProperty(oContext.getPath());
					var sSelectedValue = oSel["CountryOffice"] || "";

					oAssignmentInput.setValue(sSelectedValue);
					if (typeof oAssignmentInput.fireChange === "function") {
						oAssignmentInput.fireChange({
							value: sSelectedValue
						});
					}

					bSelectionApplied = true;
				}
			}.bind(this);

			if (!oAssignmentInput) {
				return;
			}

			var oValueHelpDialog = new sap.ui.ux3.ToolPopup({
				modal: true,
				inverted: false,
				title: "Oficina",
				opener: oAssignmentInput.getId(),
				closed: function () {
					fnApplySelection();
				}
			});

			var oOkButton = new sap.ui.commons.Button({
				text: "OK",
				press: function (oEvent) {
					oEvent.getSource().getParent().close();
				}
			});

			oValueHelpDialog.addButton(oOkButton);

			oHelpTable = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				visibleRowCount: 7,
				width: "300pt",
				rowSelectionChange: function (oSelectionEvent) {
					fnApplySelection();
					oSelectionEvent.getSource().getParent().close();
				}
			});

			oHelpTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Oficina"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "CountryOffice"),
					sortProperty: "CountryOffice",
					filterProperty: "CountryOffice",
				})
			);

			oValueHelpDialog.addContent(oHelpTable);

			var servicio = "/sap/opu/odata/sap/ZMM_POPUP_4170V2_SRV";
			var ozModel = new sap.ui.model.odata.ODataModel(servicio, true);

			var oProperty = {
				Bukrs: sCompanyCode
			};

			// this._getDialogPopUpWorkflow().close();

			ozModel.callFunction("/VH_XRef1", {
				method: "POST",
				urlParameters: oProperty,
				success: function (oData, response) {

					var oHeaderTableModel = new sap.ui.model.json.JSONModel();
					oHeaderTableModel.setData(oData.results);
					oHelpTable.setModel(oHeaderTableModel);
					oHelpTable.bindRows("/");

					oHelpTable.autoResizeColumn(3);

				}.bind(this), // callback function for success
				error: function (oError) {
					sap.m.MessageToast.show("Se produjo un error");
					// this.setBusy(false);
				}.bind(this)
			});

			// oHelpTable.bindAggregation("rows", "{/claseSubvencionadaSet});

			oValueHelpDialog.open();
		}
	});
	return H;
});