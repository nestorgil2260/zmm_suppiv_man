sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (C, J) {
	"use strict";
	var H = sap.ui.controller("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.controller.HeaderMoreCustom", {
		//    onControlChanged: function (e) {
		//        this.getOwnerComponent().getAppController().getS1Controller().onControlChanged(e);
		//    }

		onInit: function () {
			this._ensureStateModel();
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

		_getInnerControl: function (oControl) {
			if (!oControl) {
				return null;
			}

			if (typeof oControl.getInnerControls === "function") {
				var aInnerControls = oControl.getInnerControls();

				if (aInnerControls && aInnerControls.length) {
					return aInnerControls[0];
				}
			}

			return oControl;
		},

		_getAssignmentReferenceInput: function () {
			return this._getInnerControl(this.getView().byId("idS2P.MM.MSI.InputAssignmentReference"));
		},

		_getAccountingHeaderTextInput: function () {
			return this._getInnerControl(this.getView().byId("idS2P.MM.MSI.InputAccountingDocumentHeaderText"));
		},

		_getGlobalControl: function (sId) {
			return sap.ui.getCore().byId(this.getView()._sOwnerId + "---MMIV_HEADER_ID_S1--" + sId);
		},

		_getCompanyCodeValue: function () {
			var oCompanyCode = this._getGlobalControl("idS2P.MM.MSI.CEInputCompanyCode");

			return oCompanyCode ? oCompanyCode.getValue() : "";
		},

		_getPostingYear: function () {
			var oPostingDate = this._getGlobalControl("idS2P.MM.MSI.CEDatePickerPostingDate");
			var oDatePicker = oPostingDate && typeof oPostingDate.getContent === "function" ? oPostingDate.getContent()[0] : null;
			var oDateValue = oDatePicker && typeof oDatePicker.getDateValue === "function" ? oDatePicker.getDateValue() : null;

			return oDateValue ? oDateValue.getFullYear() : "";
		},

		_getGrossAmountValue: function () {
			var oGrossAmount = this._getGlobalControl("idS2P.MM.MSI.CEInputInvoiceGrossAmount");

			return oGrossAmount ? oGrossAmount.getValue().split(".").join("") : "";
		},

		_getGrossAmountCurrency: function () {
			var oGrossAmountCurrency = this._getGlobalControl("idS2P.MM.MSI.CEInputInvoiceGrossAmount-sfEdit");

			return oGrossAmountCurrency ? oGrossAmountCurrency.getValue() : "";
		},

		_getExchangeRateValue: function () {
			var oExchangeRate = this._getGlobalControl("idS2P.MM.MSI.InputExchangeRate");

			return oExchangeRate ? oExchangeRate.getValue() : "";
		},

		_getSupplierInvoice: function () {
			var sSupplierInvoice = window.location.href.substr(window.location.href.search("SupplierInvoice=") + 16, 10);

			return isNaN(sSupplierInvoice) ? "" : sSupplierInvoice;
		},

		_wireInputOnce: function (oInput, sKey, fnCallback) {
			if (!oInput || oInput.data(sKey)) {
				return;
			}

			fnCallback(oInput);
			oInput.data(sKey, true, true);
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
			var oXref1Input = this._getAssignmentReferenceInput();
			var oXref2Input = this._getAccountingHeaderTextInput();
			var oAssignmentLabel = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference-label");
			var oHeaderTextLabel = this.getView().byId("idS2P.MM.MSI.InputAccountingDocumentHeaderText-label");
			var sCompanyCode = this._getCompanyCodeValue();
			var oGrossAmount = this._getGlobalControl("idS2P.MM.MSI.CEInputInvoiceGrossAmount");
			var bEditable = oGrossAmount ? oGrossAmount.getEditable() : true;

			if (oAssignmentLabel) {
				oAssignmentLabel.setText("XRef1");
				oAssignmentLabel.setRequired(true);
			}

			if (oHeaderTextLabel) {
				oHeaderTextLabel.setText("Clave referencia 2");
				oHeaderTextLabel.setRequired(sCompanyCode === "3000");
			}

			if (oXref1Input) {
				if (typeof oXref1Input.setShowValueHelp === "function") {
					oXref1Input.setShowValueHelp(true);
				}
				if (typeof oXref1Input.setValueHelpOnly === "function") {
					oXref1Input.setValueHelpOnly(true);
				}
				if (typeof oXref1Input.setEditable === "function") {
					oXref1Input.setEditable(bEditable);
				}
				this._wireInputOnce(oXref1Input, "xref1ValueHelpAttached", function (oInput) {
					if (typeof oInput.attachValueHelpRequest === "function") {
						oInput.attachValueHelpRequest(this.onValueHelpInputAssignmentReferenceZ, this);
					}
				}.bind(this));
			}

			if (oXref2Input) {
				if (typeof oXref2Input.setVisible === "function") {
					oXref2Input.setVisible(true);
				}
				if (typeof oXref2Input.setShowValueHelp === "function") {
					oXref2Input.setShowValueHelp(true);
				}
				if (typeof oXref2Input.setValueHelpOnly === "function") {
					oXref2Input.setValueHelpOnly(true);
				}
				if (typeof oXref2Input.setEditable === "function") {
					oXref2Input.setEditable(bEditable);
				}
				this._wireInputOnce(oXref2Input, "xref2ValueHelpAttached", function (oInput) {
					if (typeof oInput.attachValueHelpRequest === "function") {
						oInput.attachValueHelpRequest(this.onSearchXref2, this);
					}
				}.bind(this));
			}

			this._wireInputOnce(oGrossAmount, "xrefAmountChangeAttached", function (oInput) {
				if (typeof oInput.attachChange === "function") {
					oInput.attachChange(this._handleAmountChange, this);
				}
			}.bind(this));
		},

		onSearchXref2: function (oEvent) {

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
			var path;
			var oTableStdListTemplate;
			var oFilterTableNo;
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpXref2VH", this);
				this.oDialog.setModel(ozModel);
			}
			path = "/empleadoVHSet";
			oTableStdListTemplate = new sap.m.StandardListItem({
				title: "{Partner}",
				description: "{Name1Text}"
			}); // //create a filter for the binding
			oFilterTableNo = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, sInputValue);
			var oFilterCompanyCode = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, CompanyCode);
			var oFilterFiscalYear = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, FiscalYear);
			var oFilterSupplierInvoiceValue = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, SupplierInvoiceValue);
			var oFilterSupplierInvoiceValueCurr = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains,
				SupplierInvoiceValueCurr);
			var oFilterSupplierInvoice = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains,
				SupplierInvoice);
			var oFilterTasa = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains,
				tasa);	

			this.oDialog.unbindAggregation("items");
			this.oDialog.bindAggregation("items", {
				path: path,
				template: oTableStdListTemplate,
				filters: [oFilterTableNo, oFilterCompanyCode, oFilterFiscalYear, oFilterSupplierInvoiceValue, oFilterSupplierInvoiceValueCurr, oFilterSupplierInvoice, oFilterTasa ]
			}); // }// open value help dialog filtered by the input value
			this.oDialog.open(sInputValue);
		},

		onSearchXref2LiveChange: function (oEvent) {

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
			
			var tasa = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.HeaderMore-defaultXML--idS2P.MM.MSI.InputExchangeRate").getValue();

			var servicio = "/sap/opu/odata/sap/ZMM_SUPPLIER_INVOICE_MANAGE_SRV";
			var ozModel = new sap.ui.model.odata.ODataModel(servicio, true);

			var sInputValue = sap.ui.getCore().byId(oEvent.getSource().getId() + "-" + "searchField").getValue();
			this.inputId = oEvent.getSource().getId() + "-" + "searchField";
			var path;
			var oTableStdListTemplate;
			var oFilterTableNo;
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpXref2VH", this);
				this.oDialog.setModel(ozModel);
			}
			path = "/empleadoVHSet";
			oTableStdListTemplate = new sap.m.StandardListItem({
				title: "{Partner}",
				description: "{Name1Text}"
			}); // //create a filter for the binding
			oFilterTableNo = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, sInputValue);
			var oFilterCompanyCode = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, CompanyCode);
			var oFilterFiscalYear = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, FiscalYear);
			var oFilterSupplierInvoiceValue = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains, SupplierInvoiceValue);
			var oFilterSupplierInvoiceValueCurr = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains,
				SupplierInvoiceValueCurr);
			var oFilterSupplierInvoice = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains,
				SupplierInvoice);
				
			var oFilterTasa = new sap.ui.model.Filter("Name1Text", sap.ui.model.FilterOperator.Contains,
				tasa);	

			this.oDialog.unbindAggregation("items");
			this.oDialog.bindAggregation("items", {
				path: path,
				template: oTableStdListTemplate,
				filters: [oFilterTableNo, oFilterCompanyCode, oFilterFiscalYear, oFilterSupplierInvoiceValue, oFilterSupplierInvoiceValueCurr, oFilterSupplierInvoice, oFilterTasa]
			}); // }// open value help dialog filtered by the input value
			this.oDialog.open(sInputValue);
		},
		handleTableValueHelpConfirm: function (e) {

			var s = e.getParameter("selectedItem");
			// var CompanyCode = jQuery.sap.getUriParameters().get("CompanyCode");
			var CompanyCode = this._getCompanyCodeValue();
			var FiscalYear = this._getPostingYear();
			// var SupplierInvoiceValue = window.location.href.substr(window.location.href.search("SupplierInvoiceValue=") + 16, 10);

			// var SupplierInvoiceValue = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount").getValue();

			// var SupplierInvoiceValueCurr = 	sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount-sfEdit").getValue();
			if (s) {

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

		},

			onValueHelpInputAssignmentReferenceZ: function (oEvent) {
			var that = this;

			var XREF1Z = this._getAssignmentReferenceInput();

			var oId = XREF1Z.getId();

			var oValueHelpDialog = new sap.ui.ux3.ToolPopup({
				modal: true,
				inverted: false, // disable color inversion
				title: "Oficina",
				opener: oId, // locate dialog next to this field
				closed: function (oEvent) {
					// return selected tabled line/value
					// var oCore = sap.ui.getCore();
					var XREF1Z = that.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ");

					var oContext = oHelpTable.getContextByIndex(oHelpTable.getSelectedIndex());
					if (oContext) {
						var oSel = oContext.getModel().getProperty(oContext.getPath());
						XREF1Z.setValue(oSel["CountryOffice"]);
						// oText_clase_subvencionada.setValue(oSel["TextoAporte"]);
					};

				}
			});

			var oOkButton = new sap.ui.commons.Button({
				text: "OK",
				press: function (oEvent) {
					oEvent.getSource().getParent().close();
				}
			});

			oValueHelpDialog.addButton(oOkButton);

			var oHelpTable = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				visibleRowCount: 7,
				width: "300pt",
				rowSelectionChange: function (oEvent) {
						var XREF1Z = that.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ");

						var oContext = oHelpTable.getContextByIndex(oHelpTable.getSelectedIndex());
						if (oContext) {
							var oSel = oContext.getModel().getProperty(oContext.getPath());
							XREF1Z.setValue(oSel["CountryOffice"]);
							// oText_clase_subvencionada.setValue(oSel["TextoAporte"]);
						};

						oEvent.getSource().getParent().close();
					}
					// rows: "{/verbo_VhSet}"
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

			var oBukrs = sap.ui.getCore().byId("" + XREF1Z._sOwnerId + "---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputCompanyCode").getValue();

			var oProperty = {
				Bukrs: oBukrs
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