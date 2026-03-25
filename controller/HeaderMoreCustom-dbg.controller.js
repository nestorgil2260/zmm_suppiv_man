sap.ui.define(["sap/ui/core/mvc/Controller"], function (C) {
	"use strict";
	var H = sap.ui.controller("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.controller.HeaderMoreCustom", {
		//    onControlChanged: function (e) {
		//        this.getOwnerComponent().getAppController().getS1Controller().onControlChanged(e);
		//    }

		onInit: function () {
			var labelassigment = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference-label");

			if (labelassigment) {

				labelassigment.setRequired(true);
				labelassigment.setText("XRef1");
			}

			var XREF1 = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference");

			if (XREF1) {

				XREF1.setVisible(false);

			}

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("details").attachDisplay(jQuery.proxy(this.onAfterRendering, this));

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.attachRouteMatched(this._onObjectMatched, this);

		},

		_onObjectMatched: function (oEvent) {

			var c = "C";
		},

		onSearchXref2: function (oEvent) {

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
			var CompanyCodeInput = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputCompanyCode");
			if (CompanyCodeInput) {
				var CompanyCode = CompanyCodeInput.getValue();
			}
			// var CompanyCode = window.location.href.substr(window.location.href.search("CompanyCode=") + 12,4);
			var FiscalYear = sap.ui.getCore().byId("" + this.getView()._sOwnerId + "---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEDatePickerPostingDate")
				.getContent().getDateValue().getFullYear();
			// var SupplierInvoiceValue = window.location.href.substr(window.location.href.search("SupplierInvoiceValue=") + 16, 10);

			// var SupplierInvoiceValue = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount").getValue();

			// var SupplierInvoiceValueCurr = 	sap.ui.getCore().byId("" + this.getView()._sOwnerId +
			// 	"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount-sfEdit").getValue();
			if (s) {

				if (this.byId(this.inputId)) {
					var xref2 = this.byId(this.inputId);
				} else {
					xref2 = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference2Z");
				}

				if (CompanyCode && CompanyCode === "3000") {

					if (s.getBindingContext().getObject().BuGroup != "A" && s.getBindingContext().getObject().BuGroup != "B") {
						sap.m.MessageBox.error("El código de cliente interno no es un aprobador válido", {});
						xref2.data("noError", "", true);
						xref2.setValue("");
						xref2.data("dato", "", true);
					} else if (s.getBindingContext().getObject().BuGroup == "B") {
						sap.m.MessageBox.error("El código de cliente int. no es un aprobador válido de acuerdo al monto", {});
						xref2.data("noError", "B", true);
						xref2.setValue("");
						xref2.data("dato", "", true);
					} else {
						xref2.data("noError", "X", true);
						xref2.setValue(s.getBindingContext().getObject().Partner);
					}
				} else {
					xref2.data("noError", "X", true);
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

			var CompanyCodeInput = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputCompanyCode");
			if (CompanyCodeInput) {
				var urlCompanyCode = CompanyCodeInput.getValue();
			}

			// var urlCompanyCode = window.location.href.substr(window.location.href.search("CompanyCode") + 12, 4);

			var XREF1Z = this.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ");
			var XREF2Z = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference2Z");

			var XREF1 = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference");

			var CompanyCode = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputCompanyCode");

			var GrossAmount = sap.ui.getCore().byId("" + this.getView()._sOwnerId +
				"---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEInputInvoiceGrossAmount");

			if (XREF1 && XREF1Z && XREF2Z) {

				XREF1.setVisible(false);
				// XREF1.setValue(XREF1Z.getValue());
				XREF1Z.setEditable(GrossAmount.getEditable());
				XREF2Z.setEditable(GrossAmount.getEditable());

				if (urlCompanyCode) {

					if (XREF1Z.data("dato") != "" && XREF1Z.getValue() === "") {
						XREF1Z.setValue(XREF1Z.data("dato"));
					} else if ((XREF1Z.data("dato") === "" || !XREF1Z.data("dato")) && XREF1Z.getValue() != "") {
						XREF1Z.data("dato", XREF1Z.getValue(), true);
					}

					if (XREF2Z.data("noError") === "" || !XREF2Z.data("noError")) {

						if (XREF2Z.data("dato") != "" && XREF2Z.getValue() === "") {
							XREF2Z.setValue(XREF2Z.data("dato"));
						} else if ((XREF2Z.data("dato") === "" || !XREF2Z.data("dato")) && XREF2Z.getValue() != "") {
							XREF2Z.data("dato", XREF2Z.getValue(), true);
						}

					}

					// XREF2Z.setValue(this.getView().getBindingContext().getProperty("AccountingDocumentHeaderText"));
				}

				// if (XREF1.getEditable() === "false") {
				// 	XREF1Z.setValue(XREF1.getValue());
				// }

			}

			if (CompanyCode && CompanyCode.getValue() === "3000") {

				var xref2 = this.getView().byId("label2");

				if (xref2) {

					xref2.setRequired(true);
				}

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

						var XREF1Z = this.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ");

						if (XREF1Z && XREF1Z.getValue === "") {
							XREF1Z.setValue(oData.results[0].CountryOffice);
						}

						var XREF1 = this.getView().byId("idS2P.MM.MSI.InputAssignmentReference");

						if (XREF1 && XREF1Z) {

							XREF1.setVisible(false);
							// XREF1.setValue(XREF1Z.getValue());

						}

					}.bind(this), // callback function for success
					error: function (oError) {
						sap.m.MessageToast.show("Se produjo un error");
						// this.setBusy(false);
					}.bind(this)
				});

			} else {
				xref2 = this.getView().byId("label2");

				if (xref2) {

					xref2.setRequired(false);
				}
			}

		},

		onValueHelpInputAssignmentReferenceZ: function (oEvent) {
			var that = this;

			var XREF1Z = this.getView().byId("idS2P.MM.MSI.InputAssignmentReferenceZ");

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