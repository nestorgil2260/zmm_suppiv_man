sap.ui.define([
	"ui/s2p/mm/supplinvoice/manage/s1/utils/Constants",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/CommonHelper",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/ODataHelper",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/Conversions",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/MessageHelper",
	"sap/m/MessageBox"
], function (C, a, O, b, M, m) {
	"use strict";
	var n = sap.ui.controller("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.controller.S1Custom", {
		Conversions: b,
		ODataHelper: O,
		CommonHelper: a,
		_dialogGlobal: null,
		_getXrefStateModel: function () {
			var oComponent = this.getOwnerComponent && this.getOwnerComponent();
			return oComponent ? oComponent.getModel("xrefState") : null;
		},

		_getXref2Status: function () {
			var oStateModel = this._getXrefStateModel();

			if (oStateModel) {
				return oStateModel.getProperty("/xref2Status") || "X";
			}

			return "X";
		},

		_setXref2Status: function (sStatus) {
			var oStateModel = this._getXrefStateModel();

			if (oStateModel) {
				oStateModel.setProperty("/xref2Status", sStatus || "");
			}
		},

		_getHeaderContextValue: function (sProperty) {
			var oContext = this.getView().getBindingContext();

			if (oContext && typeof oContext.getProperty === "function") {
				return oContext.getProperty(sProperty) || "";
			}

			return "";
		},

		_setHeaderContextValue: function (sProperty, vValue) {
			var oContext = this.getView().getBindingContext();
			var oModel = oContext && oContext.getModel && oContext.getModel();

			if (oContext && oModel && typeof oModel.setProperty === "function") {
				oModel.setProperty(oContext.getPath() + "/" + sProperty, vValue);
			}
		},

		_collectControlCandidates: function (oControl, aCandidates) {
			var aResult = aCandidates || [];
			var oMetadata;
			var mAggregations;

			if (!oControl || aResult.indexOf(oControl) !== -1) {
				return aResult;
			}

			aResult.push(oControl);
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

		_getHeaderFieldInput: function (sFieldId) {
			var oView = this.getView();
			var oControl = oView.byId(sFieldId);

			if (!oControl) {
				// Search by ID suffix in DOM (most reliable in S4 2025 extensions)
				var $el = jQuery("[id$='" + sFieldId + "']").first();
				if ($el.length === 0) { $el = jQuery("[id$='" + sFieldId + "-input']").first(); }
				if ($el.length === 0) { $el = jQuery("[id$='" + sFieldId + "-inner']").first(); }
				
				if ($el.length > 0) {
					var sFullId = $el.attr("id");
					oControl = sap.ui.getCore().byId(sFullId);
					if (!oControl) {
						var aParts = sFullId.split("-");
						while (aParts.length > 0 && !oControl) {
							oControl = sap.ui.getCore().byId(aParts.join("-"));
							aParts.pop();
						}
					}
				}
			}

			if (!oControl) {
				oControl = sap.ui.getCore().byId(sFieldId);
			}

			return this._findBestMatchingControl(oControl, function (oCandidate) {
				return !!oCandidate && typeof oCandidate.getValue === "function" && typeof oCandidate.setValue === "function";
			}) || oControl || null;
		},

		_getHeaderFieldValue: function (sFieldId, sProperty) {
			var oInput = this._getHeaderFieldInput(sFieldId);
			var sValue = oInput && typeof oInput.getValue === "function" ? oInput.getValue() : this._getHeaderContextValue(sProperty);

			return (sValue || "").trim();
		},

		_setHeaderFieldValueState: function (sFieldId, sState, sText) {
			var oInput = this._getHeaderFieldInput(sFieldId);

			if (oInput && typeof oInput.setValueState === "function") {
				oInput.setValueState(sState || sap.ui.core.ValueState.None);
			}

			if (oInput && typeof oInput.setValueStateText === "function") {
				oInput.setValueStateText(sText || "");
			}
		},

		_validateHeaderReferences: function () {
			var CompanyCode = this.getView().byId("idS2P.MM.MSI.CEInputCompanyCode");
			var sAssignmentReference = this._getHeaderFieldValue("idS2P.MM.MSI.InputAssignmentReferenceZ", "AssignmentReference");
			var sAccountingDocumentHeaderText = this._getHeaderFieldValue("idS2P.MM.MSI.InputAssignmentReference2Z",
				"AccountingDocumentHeaderText");
			var sXref2Status = this._getXref2Status();
			var bRequiresXref2 = CompanyCode && CompanyCode.getValue() === "3000";

			this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReferenceZ", sap.ui.core.ValueState.None, "");

			if (bRequiresXref2) {
				if (!sAccountingDocumentHeaderText) {
					this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReference2Z", sap.ui.core.ValueState.Error,
						"El campo Clv.Ref.2 es obligatorio");
					sap.m.MessageToast.show("El campo Clv.Ref.2 es obligatorio");
					return false;
				}

				if (sXref2Status === "") {
					this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReference2Z", sap.ui.core.ValueState.Error,
						"El código de cliente interno no es un aprobador válido");
					sap.m.MessageBox.error("El código de cliente interno no es un aprobador válido", {});
					return false;
				}

				if (sXref2Status === "B") {
					this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReference2Z", sap.ui.core.ValueState.Error,
						"El código de cliente int. no es un aprobador válido de acuerdo al monto");
					sap.m.MessageBox.error("El código de cliente int. no es un aprobador válido de acuerdo al monto", {});
					return false;
				}

				this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReference2Z", sap.ui.core.ValueState.None, "");
			} else {
				this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReference2Z", sap.ui.core.ValueState.None, "");
			}

			if (!sAssignmentReference) {
				this._setHeaderFieldValueState("idS2P.MM.MSI.InputAssignmentReferenceZ", sap.ui.core.ValueState.Error,
					"El campo Clv.Ref.1 es obligatorio");
				// Add message to MessageManager so it appears in the standard message popover
				try {
					var oContext = this.getView().getBindingContext && this.getView().getBindingContext();
					var sTarget = oContext ? oContext.getPath() + "/AssignmentReference" : "";
					var oMessage = new sap.ui.core.message.Message({
						message: "El campo Clv.Ref.1 es obligatorio",
						type: sap.ui.core.MessageType.Error,
						target: sTarget
					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);
				} catch (e) {
					// fallback to toast if MessageManager not available
					sap.m.MessageToast.show("El campo Clv.Ref.1 es obligatorio");
				}
				return false;
			}

			return true;
		},
		// setJournalEntriesButtonEnabled: function () {
		// 	if (!this.oCrossAppNavigator) {
		// 		this.oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
		// 	}
		// 	var t = this;
		// 	var J = this.byId("idS2P.MM.MSI.ButtonJournalEntries");
		// 	t.oCrossAppNavigator.isNavigationSupported([{
		// 		target: {
		// 			semanticObject: "AccountingDocument",
		// 			action: C.OUTBOUND_NAVIGATION_ACTION_DISPLAY_PROCESSFLOW_AP
		// 		}
		// 	}]).done(function (r) {
		// 		if (r[0].supported === true) {
		// 			J.setEnabled(true);
		// 		} else {
		// 			J.setEnabled(false);
		// 		}
		// 	}).fail(function () {
		// 		J.setEnabled(false);
		// 	});
		// },
		// onRouteMatched: function (o) {
		// 	var i;
		// 	var r = o.getParameter("name");
		// 	var p = o.getParameter("arguments");
		// 	if (p.hasOwnProperty("DraftId")) {
		// 		i = o.getParameter("arguments");
		// 	}
		// 	this.initGLAccountItemList();
		// 	this.oAppController.routeMatched(r, this, i);
		// 	M.restoreMessages();

		// },
		amountChange: function (oEvent) {

			var CEInputCompanyCode = this.getView().byId("idS2P.MM.MSI.CEInputCompanyCode");
			var oStateModel = this._getXrefStateModel();

			if (CEInputCompanyCode) {

				if (CEInputCompanyCode.getValue() === "3000") {
					this._setHeaderContextValue("AccountingDocumentHeaderText", "");
					this._setXref2Status("");

					if (oStateModel && !oStateModel.getProperty("/amountChangeWarningShown")) {
						sap.m.MessageBox.information(
							"Debido a la modificación del Importe bruto fact. es necesario seleccionar nuevamente una Clave de referencia 2 valida"
						);

						oStateModel.setProperty("/amountChangeWarningShown", true);
					}
				}
			}
		},

		CompanyCodeChange: function (oEvent) {

			var CompanyCode = this.getView().byId("idS2P.MM.MSI.CEInputCompanyCode");
			var xref2 = this.getView().byId("label2") || this.getView().byId("idS2P.MM.MSI.InputAssignmentReference2Z-label") || this.getView().byId("idS2P.MM.MSI.InputAccountingDocumentHeaderText-label");

			if (CompanyCode && CompanyCode.getValue() === "3000") {

				if (xref2) {

					xref2.setRequired(true);
				}

			} else {
				if (xref2) {

					xref2.setRequired(false);
				}

				this._setXref2Status("X");
			}
		},

		// determineInnerNavigationPath: function (D, s, o) {
		// 	if (s !== C.MODE_DISPLAY) {
		// 		this.sOldCompanyCode = this.oDataModel.getProperty(o.getPath() + "/CompanyCode");
		// 		if (s === C.MODE_CREATE) {
		// 			this.innerNavigateCreate(D);
		// 		} else if (s === C.MODE_EDIT) {
		// 			this.innerNavigateEdit(D);
		// 		}
		// 	} else {
		// 		if (this.oModelFacade.invoiceHasUnsupportedFeatures()) {
		// 			if (!this._bUseAdvancedPopupShown) {
		// 				this._bUseAdvancedPopupShown = true;
		// 			}
		// 			this.innerNavigateDisplay();
		// 			this.initCrossAdvancedAppNavigation();
		// 		}
		// 		this.innerNavigateDisplay();
		// 	}
		// },
		// initializeReuseComponents: function (D, s) {
		// 	var i = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/HasMsgsFromApplOutputControl");
		// 	var o = this.byId("idS2P.MM.MSI.ObjectPageSectionSituations");
		// 	var p = this.byId("idS2P.MM.MSI.ComponentContainerSituations");
		// 	var q = this.byId("idS2P.MM.MSI.ComponentContainerAttachments");
		// 	var w = this.byId("idS2P.MM.MSI.ComponentContainerWorkflow");
		// 	var r = this.byId("idS2P.MM.MSI.ComponentContainerChinaVATInvoice");
		// 	var I = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/ChinaVATInvoiceIsActive");
		// 	var t = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/CompanyCode");
		// 	this.initSituations(o, p, D, s, this.getModelFacade());
		// 	this.initAttachmentService(q, D, s, this.getModelFacade());
		// 	this.initWorkflow(w, D, s);
		// 	if (i) {
		// 		this.initOutputControl().then(function () {
		// 			this.setOutputCtrlObjectId();
		// 		}.bind(this));
		// 	}
		// 	if (I) {
		// 		this.initChinaVATInvoiceService(r, D, s, t);
		// 	}
		// },
		// innerNavigateCreate: function (D) {
		// 	this.getRouter().navTo(C.ROUTE_CREATE, {
		// 		SharedDraft: this.getIsSharedDraft(),
		// 		DraftId: D
		// 	}, true);
		// },
		// innerNavigateEdit: function (D) {
		// 	this.getRouter().navTo(C.ROUTE_EDIT, {
		// 		DraftId: D
		// 	}, true);
		// },
		// innerNavigateDisplay: function () {
		// 	this.getRouter().navTo(C.ROUTE_DISPLAY, {}, true);
		// },
		// onPurchaseOrderSmartLinkPressed: function (o) {
		// 	if (!this.oCrossAppNavigator) {
		// 		this.oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
		// 	}
		// 	this.oSmartLinkControl = o.getSource();
		// 	var B = this.oSmartLinkControl.getBindingContext();
		// 	this.oNavigationUrl = this.oCrossAppNavigator.hrefForExternal({
		// 		target: {
		// 			semanticObject: "PurchaseOrder",
		// 			action: "manage"
		// 		},
		// 		params: {
		// 			"PurchaseOrder": this.oDataModel.getProperty("PurchaseOrder", B),
		// 			"PurchaseOrderItem": this.oDataModel.getProperty("PurchaseOrderItem", B)
		// 		}
		// 	});
		// 	this.oLinkData = new sap.ui.comp.navpopover.LinkData({
		// 		href: this.oNavigationUrl,
		// 		target: "_blank"
		// 	});
		// 	this.oSmartLinkControl.attachNavigationTargetsObtained(jQuery.proxy(this.onNavigationTargetsObtained), this);
		// },
		// onNavigationTargetsObtained: function (o) {
		// 	this.oSmartLinkWithParameters = o.getParameters();
		// 	this.showPurchaseOrderNavigationPopover();
		// },
		// showPurchaseOrderNavigationPopover: function () {
		// 	var t = this;
		// 	t.oNavigationNotSupportedTitle = new sap.m.Title({
		// 		text: t.oResourceBundle.getText("YMSG_NAVIGATION_NOT_SUPPORTED")
		// 	});
		// 	t.oNavigationNotSupportedTitle.addStyleClass("sapUiSmallMarginTopBottom");
		// 	t.oNavigationNotSupportedTitle.addStyleClass("sapUiTinyMarginEnd");
		// 	t.oNavigationNotSupportedTitle.addStyleClass("sapUiSmallMarginBegin");
		// 	t.oCrossAppNavigator.isNavigationSupported([t.oNavigationUrl]).done(function (r) {
		// 		if (r[0].supported === true) {
		// 			t.oSmartLinkWithParameters.show(t.oLinkData, [], new sap.m.Text({
		// 				text: ""
		// 			}));
		// 		} else {
		// 			t.oSmartLinkWithParameters.show(undefined, [], t.oNavigationNotSupportedTitle);
		// 		}
		// 	}).fail(function () {
		// 		t.oSmartLinkWithParameters.show(undefined, [], t.oNavigationNotSupportedTitle);
		// 	});
		// },
		// doCalculateTax: function () {
		// 	this.oAppController.doAction(C.CALCULATE_TAX, jQuery.proxy(function () {
		// 		this.showBusyDialog(false);
		// 	}, this), jQuery.proxy(this.oAppController.errorCallbackShowMessageBox, this));
		// },
		// doAssignToItem: function () {
		// 	this.oAppController.doAction(C.ASSIGN_INCOMPLETE_ITEMS, jQuery.proxy(this.createItemSuccessCallback, this), jQuery.proxy(this.showMessagePopover,
		// 		this));
		// },
		// createItemSuccessCallback: function () {
		// 	this.onReferenceSectionTypeChangedSuccess();
		// 	var t = this.oView.byId(C.CONTROL_SMART_TABLE_INCOMPLETE_ITEMS);
		// 	t.rebindTable(true);
		// },

		doPostAction: function () {

			if (this._validateHeaderReferences()) {

				var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
				oPedido.data("Estado", "Post", true);

				this.doSimulateAction();

			}

			// this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
			// 	this.oAppController.doAction(C.POST, jQuery.proxy(this.doPostSuccessCallback, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback,
			// 		this));
			// }, this));
		},

		doPostHoldDiscardErrorCallback: function () {

			//TODO 
			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
			var zoData = [];
			var zoDataTemp = [];
			var mostrarPopUp = "";
			var mostrarPopUpWorkflow = "";

			var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

			var oSelected = posiciones.getSelectedItems();

			var oSelectedTemp = [];

			var posOld = 0;

			for (var j = 0; j < this.oMessageModel.oData.length; j++) {

				if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {

					var DeliveryDocumentItem = this.oMessageModel.oData[j].message.split('B*')[1];

					for (var z = 0; z < oSelected.length; z++) {

						if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(DeliveryDocumentItem, 10) &&
							parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

							posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

							zoData.push(this.oMessageModel.oData[j]);
							mostrarPopUp = "X";
							oPedido.data("mostrarPopUpFechas", "X", true);
							oPedido.data("mostrarPopUpWorkflowMessage", zoData, true);

						} else {
							oSelectedTemp.push(oSelected[z]);
						}
					}

					// oSelected = oSelectedTemp;

					oSelectedTemp = [];

				} else if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/022") {

					mostrarPopUpWorkflow = "X";

					oPedido.data("Workflow", this.oMessageModel.oData[j], true);

				} else {
					zoDataTemp.push(this.oMessageModel.oData[j]);
				}
			}

			// if (mostrarPopUpWorkflow === "X" && mostrarPopUp === "X") {
			// 	this._getDialogPopUpWorkflow().open();
			// } else 
			if (mostrarPopUp === "X") {

				if (mostrarPopUpWorkflow === "X") {
					this._getDialogPopUpWorkflow().open();
				}
				// Se encontro una forma mejor usando aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData()
				// this.oMessageModel.oData = zoDataTemp;

				var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
				var sMessage = aMessages.filter(function (mItem) {
					return mItem.code === "ZMM_MENSAJES/022";
				});
				sap.ui.getCore().getMessageManager().removeMessages(sMessage);

				var sMessage = aMessages.filter(function (mItem) {
					return mItem.code === "ZMM_MENSAJES/017";
				});
				sap.ui.getCore().getMessageManager().removeMessages(sMessage);

				this._getDialogPopUpPost().open();

				var oTable = sap.ui.getCore().byId("idFragmentpopUpPost--table0Post");

				oTable.removeAllItems();

				var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

				var oSelected = posiciones.getSelectedItems();

				var oSelectedTemp = [];

				var posOld = 0;

				for (var i = zoData.length - 1; i >= 0; i--) {

					var InboundDelivery = zoData[i].message.split('A*')[1];

					var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

					for (var z = 0; z < oSelected.length; z++) {

						if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(DeliveryDocumentItem, 10) &&
							parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

							posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

							var Material = zoData[i].message.split('C*')[1];

							var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

							var columnListItemNewLine = new sap.m.ColumnListItem({
								cells: [
									new sap.m.Input({
										value: InboundDelivery,
										editable: false
									}),
									new sap.m.Input({
										value: DeliveryDocumentItem,
										editable: false
									}),
									new sap.m.Input({
										value: Material,
										editable: false
									}),
									new sap.m.Input({
										value: MultipleAcctAssgmtDistrName,
										editable: false
									})
								]
							});

							oTable.addItem(columnListItemNewLine);

							var mostrarPopUpItems = "X";

						} else {
							oSelectedTemp.push(oSelected[z]);
						}

					}

					// oSelected = oSelectedTemp;

					oSelectedTemp = [];

				}

				if (mostrarPopUpItems != "X") {
					this._getDialogPopUpPost().close();
					// this._getDialogPopUpPost().destroy();
				}

				oTable.data("VariableR", null, true);

			} else if (mostrarPopUpWorkflow === "X") {

				this._getDialogPopUpWorkflow().open();

				var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
				var sMessage = aMessages.filter(function (mItem) {
					return mItem.code === "ZMM_MENSAJES/022";
				});
				sap.ui.getCore().getMessageManager().removeMessages(sMessage);

			} else {
				var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

				if (oPedido.data("Estado") !== null) {

					oPedido.data("Estado", null, true);

					this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
						this.oAppController.doAction(C.POST, jQuery.proxy(this.doPostSuccessCallback, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback,
							this));
					}, this));
				}
			}

			// ------------------------------------- inicio estandar ----------------------------------------

			this.showBusyDialog(false);
			this.showMessagePopover();
		},

		doCheckAction: function () {

			if (this._validateHeaderReferences()) {

				this.oMessagePopover.close();
				this.submitChanges(null, jQuery.proxy(this.doCheckCallback, this), jQuery.proxy(this.doCheckCallback, this));

			}
		},
		doCheckCallback: function () {

			var zoData = [];
			var zoDataTemp = [];
			var mostrarPopUp = "";

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			if (oPedido && !oPedido.data("zodata")) {
				oPedido.data("zodata", this.oMessageModel.oData, true);
			}

			for (var j = 0; j < this.oMessageModel.oData.length; j++) {

				if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {
					zoData.push(this.oMessageModel.oData[j]);
					mostrarPopUp = "X";
				} else if (this.oMessageModel.oData[j].code != "ZMM_MENSAJES/022") {
					zoDataTemp.push(this.oMessageModel.oData[j]);
				}
			}

			if (mostrarPopUp === "X") {

				// this.oMessageModel.oData = zoDataTemp;

				var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
				var sMessage = aMessages.filter(function (mItem) {
					return mItem.code === "ZMM_MENSAJES/022";
				});
				sap.ui.getCore().getMessageManager().removeMessages(sMessage);

				var sMessage = aMessages.filter(function (mItem) {
					return mItem.code === "ZMM_MENSAJES/017";
				});
				sap.ui.getCore().getMessageManager().removeMessages(sMessage);

				this._getDialogPopUp().open();

				var oTable = sap.ui.getCore().byId("idFragmentpopUp--table0");

				oTable.removeAllItems();

				var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

				var oSelected = posiciones.getSelectedItems();

				var oSelectedTemp = [];

				var posOld = 0;

				for (var i = zoData.length - 1; i >= 0; i--) {

					var InboundDelivery = zoData[i].message.split('A*')[1];

					var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

					for (var z = 0; z < oSelected.length; z++) {

						if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(DeliveryDocumentItem, 10) &&
							parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

							posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

							var Material = zoData[i].message.split('C*')[1];

							var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

							var columnListItemNewLine = new sap.m.ColumnListItem({
								cells: [
									new sap.m.Input({
										value: InboundDelivery,
										editable: false
									}),
									new sap.m.Input({
										value: DeliveryDocumentItem,
										editable: false
									}),
									new sap.m.Input({
										value: Material,
										editable: false
									}),
									new sap.m.Input({
										value: MultipleAcctAssgmtDistrName,
										editable: false
									})
								]
							});

							oTable.addItem(columnListItemNewLine);

							var mostrarPopUpItems = "X";

						} else {
							oSelectedTemp.push(oSelected[z]);
						}

					}

					// oSelected = oSelectedTemp;

					oSelectedTemp = [];

				}

				if (mostrarPopUpItems != "X") {
					this._getDialogPopUp().close();
					// this._getDialogPopUp().destroy();
				}

			}

			// ------------------------------------- inicio estandar ----------------------------------------

			var s = sap.ui.core.Component.getOwnerIdFor(this.getView());
			var o = sap.ui.component(s);
			var i = new sap.ui.core.message.Message({
				message: this.oResourceBundle.getText("XTIT_INVOICE_CHECKED_SUCCESSFULLY"),
				type: sap.ui.core.MessageType.Success,
				target: ""
			});
			o.oEventBus.subscribeOnce("ui.s2p.mm.supplinvoice.manage.s1", C.EVENT_REQUEST_COMPLETED, function () {
				setTimeout(function () {
					this.deleteDuplicateMessagesFromMessageManager();
					if (this.oMessageManager.getMessageModel().oData.length === 0 && !this.checkInvoiceChanges()) {
						this.oMessageManager.addMessages(i);
					}
					setTimeout(function () {
						if (this.oMessageManager.getMessageModel().oData.length !== 0) {
							if (this.getMode() !== C.MODE_DISPLAY) {
								this.oMessagePopover.openBy(this.oMessagesIndicator);
							}
						}
					}.bind(this), 0);
				}.bind(this), 0);
			}, this);
		},
		// checkInvoiceChanges: function () {
		// 	var i = false;
		// 	if (this.getView().byId(C.MESSAGE_BOX)) {
		// 		i = true;
		// 	}
		// 	return i;
		// },
		deleteDuplicateMessagesFromMessageManager: function () {

			var i = M.deleteDuplicateMessages();
			var tempI = [];
			for (var jj = 0; jj < i.length; jj++) {

				if (i[jj].code != "ZMM_MENSAJES/017" && i[jj].code != "ZMM_MENSAJES/022") {
					tempI.push(i[jj]);
				}
			}

			this.oMessageManager.removeAllMessages();
			i = tempI;
			this.oMessageManager.addMessages(i);

			// var i = M.deleteDuplicateMessages();
			// this.oMessageManager.removeAllMessages();
			// this.oMessageManager.addMessages(i);
		},

		doSimulateAction: function () {

			if (this._validateHeaderReferences()) {

				this.oAppController.doAction(C.SIMULATE, jQuery.proxy(function () {
					this._getComponent().oEventBus.subscribeOnce("ui.s2p.mm.supplinvoice.manage.s1", C.EVENT_REQUEST_COMPLETED, function () {

						var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
						var mostrarPopUp = "";
						var mostrarPopUpWorkflow = "";

						oPedido.data("mostrarPopUpFechas", null, true);

						if (oPedido && oPedido.data("Estado") === "Post") {

							oPedido.data("Estado", "EstadoPostPlus", true);

							var zoData = [];
							var zoDataTemp = [];

							for (var j = 0; j < this.oMessageModel.oData.length; j++) {

								if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {
									zoData.push(this.oMessageModel.oData[j]);
									mostrarPopUp = "X";
									oPedido.data("mostrarPopUpFechas", "X", true);
									oPedido.data("mostrarPopUpWorkflowMessage", zoData, true);
								} else {
									zoDataTemp.push(this.oMessageModel.oData[j]);
								}
							}

							// this.oMessageModel.oData = zoDataTemp;

							var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
							var sMessage = aMessages.filter(function (mItem) {
								return mItem.code === "ZMM_MENSAJES/022";
							});
							sap.ui.getCore().getMessageManager().removeMessages(sMessage);

							var sMessage = aMessages.filter(function (mItem) {
								return mItem.code === "ZMM_MENSAJES/017";
							});
							sap.ui.getCore().getMessageManager().removeMessages(sMessage);

							if (mostrarPopUp === "X") {

								this._getDialogPopUpPost().open();

								var oTable = sap.ui.getCore().byId("idFragmentpopUpPost--table0Post");

								oTable.removeAllItems();

								var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

								var oSelected = posiciones.getSelectedItems();

								var oSelectedTemp = [];

								var posOld = 0;

								for (var i = zoData.length - 1; i >= 0; i--) {

									var InboundDelivery = zoData[i].message.split('A*')[1];

									var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

									for (var z = 0; z < oSelected.length; z++) {

										if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(
												DeliveryDocumentItem, 10) &&
											parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

											posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

											var Material = zoData[i].message.split('C*')[1];

											var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

											var columnListItemNewLine = new sap.m.ColumnListItem({
												cells: [
													new sap.m.Input({
														value: InboundDelivery,
														editable: false
													}),
													new sap.m.Input({
														value: DeliveryDocumentItem,
														editable: false
													}),
													new sap.m.Input({
														value: Material,
														editable: false
													}),
													new sap.m.Input({
														value: MultipleAcctAssgmtDistrName,
														editable: false
													})
												]
											});

											oTable.addItem(columnListItemNewLine);

											var mostrarPopUpItems = "X";

										} else {
											oSelectedTemp.push(oSelected[z]);
										}

									}

									// oSelected = oSelectedTemp;

									oSelectedTemp = [];

								}

								if (mostrarPopUpItems != "X") {
									this._getDialogPopUpPost().close();
									// this._getDialogPopUpPost().destroy();
								}

							} else {
								oPedido.data("Estado", null, true);

								this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
									this.oAppController.doAction(C.POST, jQuery.proxy(this.doPostSuccessCallback, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback,
										this));
								}, this));
							}

						} else if (oPedido && oPedido.data("Estado") === "Completed") {

							oPedido.data("Estado", "CompletedPlus", true);

							var zoData = [];
							var zoDataTemp = [];

							for (var j = 0; j < this.oMessageModel.oData.length; j++) {

								if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {
									zoData.push(this.oMessageModel.oData[j]);
									mostrarPopUp = "X";
								} else {
									zoDataTemp.push(this.oMessageModel.oData[j]);
								}
							}

							if (mostrarPopUp === "X") {

								// this.oMessageModel.oData = zoDataTemp;

								var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
								var sMessage = aMessages.filter(function (mItem) {
									return mItem.code === "ZMM_MENSAJES/022";
								});
								sap.ui.getCore().getMessageManager().removeMessages(sMessage);

								var sMessage = aMessages.filter(function (mItem) {
									return mItem.code === "ZMM_MENSAJES/017";
								});
								sap.ui.getCore().getMessageManager().removeMessages(sMessage);

								this._getDialogPopUpComp().open();

								var oTable = sap.ui.getCore().byId("idFragmentpopUpComp--table0Comp");

								oTable.removeAllItems();

								var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

								var oSelected = posiciones.getSelectedItems();

								var oSelectedTemp = [];

								var posOld = 0;

								for (var i = zoData.length - 1; i >= 0; i--) {

									var InboundDelivery = zoData[i].message.split('A*')[1];

									var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

									for (var z = 0; z < oSelected.length; z++) {

										if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(
												DeliveryDocumentItem, 10) &&
											parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

											posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

											var Material = zoData[i].message.split('C*')[1];

											var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

											var columnListItemNewLine = new sap.m.ColumnListItem({
												cells: [
													new sap.m.Input({
														value: InboundDelivery,
														editable: false
													}),
													new sap.m.Input({
														value: DeliveryDocumentItem,
														editable: false
													}),
													new sap.m.Input({
														value: Material,
														editable: false
													}),
													new sap.m.Input({
														value: MultipleAcctAssgmtDistrName,
														editable: false
													})
												]
											});

											oTable.addItem(columnListItemNewLine);

											var mostrarPopUpItems = "X";

										} else {
											oSelectedTemp.push(oSelected[z]);
										}

									}

									// oSelected = oSelectedTemp;

									oSelectedTemp = [];

								}

								if (mostrarPopUpItems != "X") {
									this._getDialogPopUpPost().close();
									// this._getDialogPopUpPost().destroy();
								}

							} else {
								var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

								oPedido.data("Estado", null, true);

								var r = oPedido.data("r");

								this.oAppController.saveAsCompletedActionSuccessCallback(r);
								if (this.getIsFromExternalApp()) {
									this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
								}
							}

						} else {

							var zoData = [];
							var zoDataTemp = [];

							for (var j = 0; j < this.oMessageModel.oData.length; j++) {

								if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {
									zoData.push(this.oMessageModel.oData[j]);
									mostrarPopUp = "X";
								} else {
									zoDataTemp.push(this.oMessageModel.oData[j]);
								}
							}

							if (mostrarPopUp === "X") {

								// this.oMessageModel.oData = zoDataTemp;

								var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
								var sMessage = aMessages.filter(function (mItem) {
									return mItem.code === "ZMM_MENSAJES/022";
								});
								sap.ui.getCore().getMessageManager().removeMessages(sMessage);

								var sMessage = aMessages.filter(function (mItem) {
									return mItem.code === "ZMM_MENSAJES/017";
								});
								sap.ui.getCore().getMessageManager().removeMessages(sMessage);

								this._getDialogPopUpSim().open();

								var oTable = sap.ui.getCore().byId("idFragmentpopUpSim--table0Sim");

								oTable.removeAllItems();

								var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

								var oSelected = posiciones.getSelectedItems();

								var oSelectedTemp = [];

								var posOld = 0;

								for (var i = zoData.length - 1; i >= 0; i--) {

									var InboundDelivery = zoData[i].message.split('A*')[1];

									var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

									for (var z = 0; z < oSelected.length; z++) {

										if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(
												DeliveryDocumentItem, 10) &&
											parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

											posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

											var Material = zoData[i].message.split('C*')[1];

											var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

											var columnListItemNewLine = new sap.m.ColumnListItem({
												cells: [
													new sap.m.Input({
														value: InboundDelivery,
														editable: false
													}),
													new sap.m.Input({
														value: DeliveryDocumentItem,
														editable: false
													}),
													new sap.m.Input({
														value: Material,
														editable: false
													}),
													new sap.m.Input({
														value: MultipleAcctAssgmtDistrName,
														editable: false
													})
												]
											});

											oTable.addItem(columnListItemNewLine);

											var mostrarPopUpItems = "X";

										} else {
											oSelectedTemp.push(oSelected[z]);
										}

									}

									// oSelected = oSelectedTemp;

									oSelectedTemp = [];

								}

								if (mostrarPopUpItems != "X") {
									this._getDialogPopUpSim().close();
									// this._getDialogPopUpSim().destroy();

									this._navToSimulationCallBack.apply(this, arguments);
								}

								oTable.data("Estado", "S", true);
							} else {
								this._navToSimulationCallBack.apply(this, arguments);
							}

							// ------------------------------------- inicio estandar ----------------------------------------

							//this._navToSimulationCallBack.apply(this, arguments);
						}
					}, this);
				}, this), jQuery.proxy(this.doSimulateErrorCallback, this));
			}
		},

		doSimulateErrorCallback: function () {

			var zoData = [];
			var zoDataTemp = [];
			var mostrarPopUp = "";
			var mostrarPopUpWorkflow = "";
			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			for (var j = 0; j < this.oMessageModel.oData.length; j++) {

				if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {
					zoData.push(this.oMessageModel.oData[j]);
					mostrarPopUp = "X";
				} else {
					zoDataTemp.push(this.oMessageModel.oData[j]);
				}
			}

			// this.oMessageModel.oData = zoDataTemp;

			var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
			var sMessage = aMessages.filter(function (mItem) {
				return mItem.code === "ZMM_MENSAJES/022";
			});
			sap.ui.getCore().getMessageManager().removeMessages(sMessage);

			var sMessage = aMessages.filter(function (mItem) {
				return mItem.code === "ZMM_MENSAJES/017";
			});
			sap.ui.getCore().getMessageManager().removeMessages(sMessage);

			if (mostrarPopUp === "X") {

				this._getDialogPopUpSim().open();

				var oTable = sap.ui.getCore().byId("idFragmentpopUpSim--table0Sim");

				oTable.removeAllItems();

				var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

				var oSelected = posiciones.getSelectedItems();

				var oSelectedTemp = [];

				var posOld = 0;

				for (var i = zoData.length - 1; i >= 0; i--) {

					var InboundDelivery = zoData[i].message.split('A*')[1];

					var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

					for (var z = 0; z < oSelected.length; z++) {

						if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(DeliveryDocumentItem, 10) &&
							parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

							posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

							var Material = zoData[i].message.split('C*')[1];

							var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

							var columnListItemNewLine = new sap.m.ColumnListItem({
								cells: [
									new sap.m.Input({
										value: InboundDelivery,
										editable: false
									}),
									new sap.m.Input({
										value: DeliveryDocumentItem,
										editable: false
									}),
									new sap.m.Input({
										value: Material,
										editable: false
									}),
									new sap.m.Input({
										value: MultipleAcctAssgmtDistrName,
										editable: false
									})
								]
							});

							oTable.addItem(columnListItemNewLine);

							var mostrarPopUpItems = "X";

						} else {
							oSelectedTemp.push(oSelected[z]);
						}

					}

					// oSelected = oSelectedTemp;

					oSelectedTemp = [];

				}

				if (mostrarPopUpItems != "X") {
					this._getDialogPopUpSim().close();
					// this._getDialogPopUpSim().destroy();
					this._navToSimulationCallBack.apply(this, arguments);
				}

				oTable.data("Estado", "E", true);

			} else {
				this._navToSimulationCallBack.apply(this, arguments);
			}

			// ------------------------------------- inicio estandar ----------------------------------------

			this._getComponent().oEventBus.subscribeOnce("ui.s2p.mm.supplinvoice.manage.s1", C.EVENT_REQUEST_COMPLETED, function () {
				setTimeout(function () {

					this.deleteDuplicateMessagesFromMessageManager();

					this.oMessagePopover.openBy(this.oMessagesIndicator);
				}.bind(this), 0);
			}, this);
		},

		_getDialogPopUp: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			if (oPedido) {

				// create a fragment with dialog, and pass the selected data
				if (!oPedido.data("_getDialogPopUp")) {

					var oTable = sap.ui.getCore().byId("idFragmentpopUp--table0");

					if (oTable) {
						oTable.destroy();
					}

					this.dialog = sap.ui.xmlfragment("idFragmentpopUp", "ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUp",
						this);
					//debugger;
					oPedido.data("_getDialogPopUp", this.dialog, true);
				} else {
					this.dialog = oPedido.data("_getDialogPopUp");
				}
				//debugger;
				return this.dialog;

			}
		},
		_getDialogPopUpWorkflow: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			if (oPedido) {
				// create a fragment with dialog, and pass the selected data
				if (!oPedido.data("_getDialogPopUpWorkflow")) {
					// This fragment can be instantiated from a controller as follows:
					this.dialogWorkflow = sap.ui.xmlfragment("idFragmentpopUpWorkflow",
						"ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpWorkflow",
						this);
					//debugger;
					oPedido.data("_getDialogPopUpWorkflow", this.dialogWorkflow, true);
				} else {
					this.dialogWorkflow = oPedido.data("_getDialogPopUpWorkflow");
				}
				//debugger;
				return this.dialogWorkflow;

			}
		},

		_getDialogPopUpSim: function () {
			// create a fragment with dialog, and pass the selected data

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			if (oPedido) {
				if (!oPedido.data("_getDialogPopUpSim")) {

					var oTable = sap.ui.getCore().byId("idFragmentpopUpSim--table0Sim");

					if (oTable) {
						oTable.destroy();
					}

					// This fragment can be instantiated from a controller as follows:
					this.dialogSim = sap.ui.xmlfragment("idFragmentpopUpSim",
						"ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpSim",
						this);
					//debugger;
					oPedido.data("_getDialogPopUpSim", this.dialogSim, true);
				} else {
					this.dialogSim = oPedido.data("_getDialogPopUpSim");
				}
				//debugger;
				return this.dialogSim;

			}
		},

		_getDialogPopUpPost: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			if (oPedido) {
				// create a fragment with dialog, and pass the selected data
				if (!oPedido.data("_getDialogPopUpPost")) {

					var table0Post = sap.ui.getCore().byId("idFragmentpopUpPost--table0Post");

					if (table0Post) {
						table0Post.destroy();
					}

					// This fragment can be instantiated from a controller as follows:
					this.dialogPost = sap.ui.xmlfragment("idFragmentpopUpPost",
						"ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpPost",
						this);
					//debugger;
					oPedido.data("_getDialogPopUpPost", this.dialogPost, true);
				} else {
					this.dialogPost = oPedido.data("_getDialogPopUpPost");
				}
				//debugger;
				return this.dialogPost;

			}
		},

		_getDialogPopUpComp: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			if (oPedido) {
				// create a fragment with dialog, and pass the selected data
				if (!oPedido.data("_getDialogPopUpComp")) {

					var oTable = sap.ui.getCore().byId("idFragmentpopUpComp--table0Comp");

					if (oTable) {
						oTable.destroy();
					}

					// This fragment can be instantiated from a controller as follows:
					this.dialogComp = sap.ui.xmlfragment("idFragmentpopUpComp",
						"ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.fragment.popUpComp",
						this);
					//debugger;
					oPedido.data("_getDialogPopUpComp", this.dialogComp, true);
				} else {
					this.dialogComp = oPedido.data("_getDialogPopUpComp");
				}
				//debugger;
				return this.dialogComp;

			}
		},

		closeDialogPopUp: function () {
			this._getDialogPopUp().close();
			// this._getDialogPopUp().destroy();
		},

		closeDialogPopUpSim: function () {

			var oTable = sap.ui.getCore().byId("idFragmentpopUpSim--table0Sim");

			var estado = oTable.data("Estado");

			this._getDialogPopUpSim().close();
			// this._getDialogPopUpSim().destroy();

			if (estado === "S") {

				this._navToSimulationCallBack.apply(this, arguments);

			}
		},

		closeDialogPopUpPost: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			var Estado = oPedido.data("Estado");

			this._getDialogPopUpPost().close();
			// this._getDialogPopUpPost().destroy();

			if (Estado === "EstadoPostPlus") {

				oPedido.data("Estado", null, true);

				this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
					this.oAppController.doAction(C.POST, jQuery.proxy(this.doPostSuccessCallback, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback,
						this));
				}, this));

			}
		},

		closeDialogPopUpComp: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

			var Estado = oPedido.data("Estado");

			this._getDialogPopUpComp().close();
			// this._getDialogPopUpComp().destroy();

			if (Estado === "CompletedPlus") {

				oPedido.data("Estado", null, true);

				var r = oPedido.data("r");

				this.oAppController.saveAsCompletedActionSuccessCallback(r);
				if (this.getIsFromExternalApp()) {
					this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
				}

			}
		},

		_handleWorkflowPopupCompletionByState: function () {

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
			var sEstado = oPedido && oPedido.data("Estado");
			var r = oPedido && oPedido.data("r");

			if (sEstado === "EstadoPostPlus") {
				oPedido.data("Estado", null, true);

				this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
					this.oAppController.doAction(C.POST, jQuery.proxy(this.doPostSuccessCallback, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback,
						this));
				}, this));

				return;
			}

			if (r) {
				this.oAppController.saveAsCompletedActionSuccessCallback(r);
				if (this.getIsFromExternalApp()) {
					this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
				}
			}
		},

		yesDialogPopUpWorkflow: function () {

			var that = this;
			var servicio = "/sap/opu/odata/sap/ZMM_POPUP_4170V2_SRV";
			var ozModel = new sap.ui.model.odata.ODataModel(servicio, true);

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
			var r = oPedido.data("r");

			if (!r) {
				return;
			}

			var oProperty = {
				Belnr: r.SavePrelim.SupplierInvoice,
				Gjahr: oPedido.data("Workflow").message.split('B*')[1],
				Bukrs: oPedido.data("Workflow").message.split('C*')[1],
				Blart: oPedido.data("Workflow").message.split('D*')[1],
				Respuesta: "X"
					// "application-Test-url-component---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEDatePickerDocumentDate-datePicker-inner")
					// Buzei: tabla.getBindingContext().getProperty("Buzei")
			};

			this._getDialogPopUpWorkflow().close();
			// this._getDialogPopUpWorkflow().destroy();

			ozModel.callFunction("/consultaPopup", {
				method: "POST",
				urlParameters: oProperty,
				success: function (oData, response) {
					this._handleWorkflowPopupCompletionByState();

					// this.setBusy(false);
				}.bind(this), // callback function for success
				error: function (oError) {
					sap.m.MessageToast.show("Se produjo un error");
					// this.setBusy(false);
				}.bind(this)
			});

		},

		closeDialogPopUpWorkflow: function () {

			var that = this;
			var servicio = "/sap/opu/odata/sap/ZMM_POPUP_4170V2_SRV";
			var ozModel = new sap.ui.model.odata.ODataModel(servicio, true);

			var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
			var r = oPedido.data("r");

			if (!r) {
				return;
			}

			var oProperty = {
				Belnr: r.SavePrelim.SupplierInvoice,
				Gjahr: oPedido.data("Workflow").message.split('B*')[1],
				Bukrs: oPedido.data("Workflow").message.split('C*')[1],
				Blart: oPedido.data("Workflow").message.split('D*')[1],
				Respuesta: ""
					// "application-Test-url-component---MMIV_HEADER_ID_S1--idS2P.MM.MSI.CEDatePickerDocumentDate-datePicker-inner")
					// Buzei: tabla.getBindingContext().getProperty("Buzei")
			};

			this._getDialogPopUpWorkflow().close();
			// this._getDialogPopUpWorkflow().destroy();

			ozModel.callFunction("/consultaPopup", {
				method: "POST",
				urlParameters: oProperty,
				success: function (oData, response) {
					this._handleWorkflowPopupCompletionByState();

					// this.setBusy(false);
				}.bind(this), // callback function for success
				error: function (oError) {
					sap.m.MessageToast.show("Se produjo un error");
					// this.setBusy(false);
				}.bind(this)
			});

		},

		doHoldAction: function () {
			var o = {};
			o.SaveAction = C.SAVE_ACTION_HOLD;
			this.doHoldParkAction(o, this.doHoldSuccessCallback);
		},
		doParkAction: function () {
			var o = {};
			o.SaveAction = C.SAVE_ACTION_PARK;
			this.doHoldParkAction(o, this.doParkSuccessCallback);
		},
		doSaveAsCompletedAction: function () {

			if (this._validateHeaderReferences()) {

				var o = {};
				o.SaveAction = C.SAVE_ACTION_SAVE_AS_COMPLETED;
				this.doHoldParkAction(o, this.doSaveAsCompletedSuccessCallback);

				// this.oMessagePopover.close();
				// this.submitChanges(null, jQuery.proxy(this.doCheckCallback, this), jQuery.proxy(this.doCheckCallback, this));

			}

			// ----------------------------------- estandar

			// var o = {};
			// o.SaveAction = C.SAVE_ACTION_SAVE_AS_COMPLETED;
			// this.doHoldParkAction(o, this.doSaveAsCompletedSuccessCallback);
		},
		doHoldParkAction: function (o, s) {

			if (this._validateHeaderReferences()) {

				var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");
				oPedido.data("Estado", "Guardar", true);
				if (!oPedido.data("zodata")) {
					oPedido.data("zodata", this.oMessageModel.oData, true);
				}
				this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
					this.oAppController.doAction(C.SAVE_PRELIM, jQuery.proxy(s, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback, this),
						o);
				}, this));

			}

			// ----------------------------------------------estandar

			// this._createDeferredForParkHoldAndPostAction().then(jQuery.proxy(function () {
			// 	this.oAppController.doAction(C.SAVE_PRELIM, jQuery.proxy(s, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback, this), o);
			// }, this));
		},
		doHoldSuccessCallback: function (r) {
			this.oAppController.holdActionSuccessCallback(r);
			if (this.getIsFromExternalApp()) {
				this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
			}
		},
		doParkSuccessCallback: function (r) {
			this.oAppController.parkActionSuccessCallback(r);
			if (this.getIsFromExternalApp()) {
				this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
			}
		},
		doSaveAsCompletedSuccessCallback: function (r, oData) {

				var oPedido = this.getView().byId("idS2P.MM.MSI.MultiInputQuickPurchaseOrderEntry");

				oPedido.data("Estado", "Completed", true);

				oPedido.data("r", r, true);

				// this.doSimulateAction();

				if (oPedido.data("zodata")) {

					this.oMessageModel.oData = oPedido.data("zodata");
					var zoData = [];
					var zoDataTemp = [];
					var mostrarPopUp = "";
					var mostrarPopUpWorkflow = "";

					var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

					var oSelected = posiciones.getSelectedItems();

					var oSelectedTemp = [];

					var posOld = 0;

					for (var j = 0; j < this.oMessageModel.oData.length; j++) {

						if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/017") {

							var DeliveryDocumentItem = this.oMessageModel.oData[j].message.split('B*')[1];

							for (var z = 0; z < oSelected.length; z++) {

								if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(DeliveryDocumentItem,
										10) &&
									parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

									posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

									zoData.push(this.oMessageModel.oData[j]);
									mostrarPopUp = "X";
									oPedido.data("mostrarPopUpFechas", "X", true);
									oPedido.data("mostrarPopUpWorkflowMessage", zoData, true);

								} else {
									oSelectedTemp.push(oSelected[z]);
								}

							}

							// oSelected = oSelectedTemp;

							oSelectedTemp = [];

						} else if (this.oMessageModel.oData[j].code === "ZMM_MENSAJES/022") {

							mostrarPopUpWorkflow = "X";

							oPedido.data("Workflow", this.oMessageModel.oData[j], true);

						} else {
							zoDataTemp.push(this.oMessageModel.oData[j]);
						}
					}

					// if (mostrarPopUpWorkflow === "X" && mostrarPopUp === "X") {
					// 	this._getDialogPopUpWorkflow().open();
					// } else 
					if (mostrarPopUp === "X") {

						if (mostrarPopUpWorkflow === "X") {
							this._getDialogPopUpWorkflow().open();
						}

						// this.oMessageModel.oData = zoDataTemp;

						var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
						var sMessage = aMessages.filter(function (mItem) {
							return mItem.code === "ZMM_MENSAJES/022";
						});
						sap.ui.getCore().getMessageManager().removeMessages(sMessage);

						var sMessage = aMessages.filter(function (mItem) {
							return mItem.code === "ZMM_MENSAJES/017";
						});
						sap.ui.getCore().getMessageManager().removeMessages(sMessage);

						this._getDialogPopUpPost().open();

						var oTable = sap.ui.getCore().byId("idFragmentpopUpPost--table0Post");

						oTable.removeAllItems();

						var posiciones = this.getView().byId("idS2P.MM.MSI.CETablePOItems");

						var oSelected = posiciones.getSelectedItems();

						var oSelectedTemp = [];

						var posOld = 0;

						for (var i = zoData.length - 1; i >= 0; i--) {

							var InboundDelivery = zoData[i].message.split('A*')[1];

							var DeliveryDocumentItem = zoData[i].message.split('B*')[1];

							for (var z = 0; z < oSelected.length; z++) {

								if (parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) === parseInt(DeliveryDocumentItem,
										10) &&
									parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10) !== posOld) {

									posOld = parseInt(oSelected[z].getCells()[2].getText().split("/")[1], 10);

									var Material = zoData[i].message.split('C*')[1];

									var MultipleAcctAssgmtDistrName = zoData[i].message.split('D*')[1];

									var columnListItemNewLine = new sap.m.ColumnListItem({
										cells: [
											new sap.m.Input({
												value: InboundDelivery,
												editable: false
											}),
											new sap.m.Input({
												value: DeliveryDocumentItem,
												editable: false
											}),
											new sap.m.Input({
												value: Material,
												editable: false
											}),
											new sap.m.Input({
												value: MultipleAcctAssgmtDistrName,
												editable: false
											})
										]
									});

									oTable.addItem(columnListItemNewLine);

									var mostrarPopUpItems = "X";

								} else {
									oSelectedTemp.push(oSelected[z]);
								}

							}

							// oSelected = oSelectedTemp;

							oSelectedTemp = [];

						}

						oTable.data("VariableR", null, true);

						if (mostrarPopUpItems != "X") {
							this._getDialogPopUpPost().close();
							// this._getDialogPopUpPost().destroy();
						} else if (mostrarPopUpWorkflow != "X") {

							this.oAppController.saveAsCompletedActionSuccessCallback(r);
							if (this.getIsFromExternalApp()) {
								this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
							}

						}

					} else if (mostrarPopUpWorkflow === "X") {

						this._getDialogPopUpWorkflow().open();

						var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
						var sMessage = aMessages.filter(function (mItem) {
							return mItem.code === "ZMM_MENSAJES/022";
						});
						sap.ui.getCore().getMessageManager().removeMessages(sMessage);

					} else {
						this.oAppController.saveAsCompletedActionSuccessCallback(r);
						if (this.getIsFromExternalApp()) {
							this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
						}
					}

				} else {

					this.oAppController.saveAsCompletedActionSuccessCallback(r);
					if (this.getIsFromExternalApp()) {
						this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
					}

				}

				// ---------------- estandar 

				// this.oAppController.saveAsCompletedActionSuccessCallback(r);
				// if (this.getIsFromExternalApp()) {
				// 	this.oAppController.restartAppDependingOnMode(r[C.SAVE_PRELIM].SupplierInvoice, r[C.SAVE_PRELIM].FiscalYear);
				// }
			}
			// doEditAction: function () {
			// 	this.oAppController.startAppInEditMode();
			// },
			// doDiscardAction: function () {
			// 	m.show(this.oResourceBundle.getText("DIALOG_DISCARD"), {
			// 		icon: m.Icon.WARNING,
			// 		title: this.oResourceBundle.getText("XTIT_DISCARD"),
			// 		actions: [
			// 			m.Action.YES,
			// 			m.Action.NO
			// 		],
			// 		onClose: jQuery.proxy(function (o) {
			// 			if (o === m.Action.YES) {
			// 				this.oAppController.doAction(C.DISCARD, jQuery.proxy(this.doDiscardActionSuccessCallback, this), jQuery.proxy(this.doPostHoldDiscardErrorCallback,
			// 					this));
			// 			}
			// 		}, this),
			// 		styleClass: this.getStyleClass(),
			// 		initialFocus: m.Action.NO
			// 	});
			// },
			// doDiscardActionSuccessCallback: function () {
			// 	m.success(this.oResourceBundle.getText("DIALOG_DISCARD_SUCCESS"), {
			// 		actions: [m.Action.OK],
			// 		onClose: jQuery.proxy(function () {
			// 			this.navBack();
			// 		}, this),
			// 		styleClass: this.getStyleClass(),
			// 		initialFocus: m.Action.OK
			// 	});
			// },
			// doSimulateAction: function () {
			// 	this.oAppController.doAction(C.SIMULATE, jQuery.proxy(function () {
			// 		this._getComponent().oEventBus.subscribeOnce("ui.s2p.mm.supplinvoice.manage.s1", C.EVENT_REQUEST_COMPLETED, function () {
			// 			this._navToSimulationCallBack.apply(this, arguments);
			// 		}, this);
			// 	}, this), jQuery.proxy(this.doSimulateErrorCallback, this));
			// },
			// doSimulateErrorCallback: function () {
			// 	this._getComponent().oEventBus.subscribeOnce("ui.s2p.mm.supplinvoice.manage.s1", C.EVENT_REQUEST_COMPLETED, function () {
			// 		setTimeout(function () {
			// 			this.oMessagePopover.openBy(this.oMessagesIndicator);
			// 		}.bind(this), 0);
			// 	}, this);
			// },
			// _getComponent: function () {
			// 	var s = sap.ui.core.Component.getOwnerIdFor(this.getView());
			// 	return sap.ui.component(s);
			// },
			// doReleaseAction: function () {
			// 	this.oAppController.doAction(C.RELEASE, jQuery.proxy(this.doReleaseSuccessCallback, this), jQuery.proxy(this.errorCallbackShowMessageBox,
			// 		this));
			// },
			// doReleaseSuccessCallback: function () {
			// 	this.oAppController.releaseActionSuccessCallback();
			// 	this.oModelFacade.reloadInvoice(jQuery.proxy(this.onModelInitialized, this));
			// },
			// displayFollowDocuments: function () {
			// 	var D = this.getModelFacade().getRootProperty(C.SUPPLIER_INVOICE);
			// 	var s = 2;
			// 	var i = this.getModelFacade().getRootProperty(C.FISCAL_YEAR);
			// 	if (D && s && i) {
			// 		var p = {
			// 			target: {
			// 				semanticObject: C.OUTBOUND_NAVIGATION_SEMANTIC_OBJECT_ACCOUNTING_DOCUMENT,
			// 				action: C.OUTBOUND_NAVIGATION_ACTION_DISPLAY_PROCESSFLOW_AP
			// 			},
			// 			params: {
			// 				"DocumentNumber": D,
			// 				"DocumentType": s,
			// 				"FiscalYear": i
			// 			}
			// 		};
			// 		this.oAppController.navigateToExternalApplication(p, this);
			// 	}
			// },
			// handleButtonSharePopoverPress: function (o) {
			// 	if (!this.oSharePopover) {
			// 		var s = new l(this);
			// 		this.oSharePopover = sap.ui.xmlfragment(this.createId(C.POPOVER_FRAGMENT_PREFIX), C.POPOVER_FRAGMENT_SHARE, s);
			// 		this.getView().addDependent(this.oSharePopover);
			// 	}
			// 	var i = o.getSource();
			// 	jQuery.sap.delayedCall(0, this, function () {
			// 		this.oSharePopover.openBy(i);
			// 	});
			// },
			// doCancelDraftAction: function () {
			// 	this.showBusyDialog(true);
			// 	this.oAppController.doCancelDraft(this.onRequestFailed).always(function () {
			// 		this.showBusyDialog(false);
			// 	}.bind(this));
			// },
			// doConfirmInvoice: function () {
			// 	if (this.oConfirmDialog) {
			// 		this.oConfirmDialog.destroy();
			// 	}
			// 	var D = new h(this);
			// 	this.oConfirmDialog = sap.ui.xmlfragment(this.createId(C.DIALOG_FRAGMENT_PREFIX), C.DIALOG_FRAGMENT_CONFIRM, D);
			// 	this.oView.addDependent(this.oConfirmDialog);
			// 	jQuery.sap.syncStyleClass(C.SAP_CSS_CLASS_COMPACT_MODE, this.oView, this.oConfirmDialog);
			// 	this.oConfirmDialog.open();
			// },
			// doCancelInvoice: function () {
			// 	if (!this.oCancelDialog) {
			// 		var D = new j(this);
			// 		this.oCancelDialog = sap.ui.xmlfragment(this.createId(C.DIALOG_FRAGMENT_PREFIX), C.DIALOG_FRAGMENT_CANCEL, D);
			// 		this.oView.addDependent(this.oCancelDialog);
			// 	}
			// 	jQuery.sap.syncStyleClass(C.SAP_CSS_CLASS_COMPACT_MODE, this.oView, this.oCancelDialog);
			// 	this.oCancelDialog.open();
			// },
			// _createDeferredForParkHoldAndPostAction: function () {
			// 	var i = $.Deferred();
			// 	var I = this.getIsSharedDraft();
			// 	if (I) {
			// 		var o = this.byId(C.CONTROL_SMART_TABLE_INCOMPLETE_ITEMS).getTable().getBinding("items");
			// 		if (o && o.getLength() > 0) {
			// 			m.show(this.oResourceBundle.getText("DIALOG_DISCARD_INCOMPLETE_ITEMS"), {
			// 				icon: m.Icon.WARNING,
			// 				title: this.oResourceBundle.getText("XTIT_DISCARD_INCOMPLETE_ITEMS"),
			// 				actions: [
			// 					m.Action.YES,
			// 					m.Action.NO
			// 				],
			// 				onClose: function (p) {
			// 					if (p === m.Action.YES) {
			// 						i.resolve();
			// 					} else {
			// 						i.reject();
			// 					}
			// 				},
			// 				styleClass: this.getStyleClass(),
			// 				initialFocus: m.Action.NO
			// 			});
			// 		} else {
			// 			i.resolve();
			// 		}
			// 	} else {
			// 		i.resolve();
			// 	}
			// 	return i.promise();
			// },
			// doAmountConversion: function (o) {
			// 	this.showBusyDialog(true);
			// 	var s = o.getSource();
			// 	var i = this.getModelFacade();
			// 	var I = a.getInternalValue(s);
			// 	var t = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/TaxConversionIsNotEnabled");
			// 	var p = s.getBindingContext().getPath();
			// 	var P = s.getBinding("value").getPath();
			// 	var q = {
			// 		"NodeKey": i.getDraftId(),
			// 		"State": i.getInvoiceState(),
			// 		"AmountInTransCrcy": I[0],
			// 		"TransactionCurrency": I[1]
			// 	};
			// 	if (!t) {
			// 		this.oDataModel.callFunction("/ConvertToLocalCurrency", {
			// 			urlParameters: q,
			// 			method: "GET",
			// 			success: jQuery.proxy(this.doAmountConvSuccessCallback, this, p, P),
			// 			error: jQuery.proxy(this.showBusyDialog, this, false)
			// 		});
			// 	} else {
			// 		this.showBusyDialog(false);
			// 	}
			// },
			// doAmountConvSuccessCallback: function (p, P, r) {
			// 	if (r.ConvertToLocalCurrency.ActionOk) {
			// 		switch (P) {
			// 		case C.TAX_AMOUNT_TRANS_CRCY:
			// 			this.oDataModel.setProperty(p + "/TaxAmountInCoCodeCrcy", r.ConvertToLocalCurrency.AmountInCoCodeCrcy);
			// 			break;
			// 		case C.TAX_BASE_AMOUNT_TRANS_CRCY:
			// 			this.oDataModel.setProperty(p + "/TaxBaseAmountInCoCodeCrcy", r.ConvertToLocalCurrency.AmountInCoCodeCrcy);
			// 			break;
			// 		default:
			// 			break;
			// 		}
			// 	}
			// 	this.showBusyDialog(false);
			// },
			// onBeforeRebindTable: function (o) {
			// 	var B = o.getParameter("bindingParams");
			// 	this.handleSmartTableGrouping(B);
			// },
			// _rebindTables: function () {
			// 	var t = this.byId(C.CONTROL_SMART_TABLE_PO_ITEMS);
			// 	var T = this.byId(C.CONTROL_SMART_TABLE_INCOMPLETE_ITEMS);
			// 	var o = this.byId(C.CONTROL_SMART_TABLE_TAX);
			// 	var p = this.byId(C.CONTROL_SMART_TABLE_WITHHOLDING_TAX);
			// 	var q = [
			// 		t,
			// 		T,
			// 		o,
			// 		p
			// 	];
			// 	for (var i = 0; i < q.length; i++) {
			// 		q[i].setBindingContext(this.getView().getBindingContext());
			// 	}
			// },
			// _setIgnoredTableFields: function (r) {
			// 	var o = this.getModel().getProperty(r);
			// 	var p = this.byId("idS2P.MM.MSI.SmartTablePOItems");
			// 	var i = this.byId("idS2P.MM.MSI.ColumnSupplierInvoiceItemExternalTaxJurisdictionCode");
			// 	var I = this.byId("idS2P.MM.MSI.ColumnSupplierInvoiceItemTaxJurisdictionCode");
			// 	var t = this.byId("idS2P.MM.MSI.SmartTableTax");
			// 	var T = this.byId("idS2P.MM.MSI.CEColumnTaxTaxJurisdictionCode");
			// 	var q = this.byId("idS2P.MM.MSI.ColumnTaxRateValidityStartDate");
			// 	var D = this.byId("idS2P.MM.MSI.SmartFieldUnplndDelivCostTaxRateDesc");
			// 	if (o.ExternalTaxJurisdictionIsActive) {
			// 		i.setVisible(true);
			// 	} else {
			// 		i.setVisible(false);
			// 	}
			// 	if (o.InternalTaxJurisdictionIsActive) {
			// 		I.setVisible(true);
			// 	} else {
			// 		I.setVisible(false);
			// 	}
			// 	p.rebindTable();
			// 	if (o.TaxJurisdictionIsActive) {
			// 		T.setVisible(true);
			// 	} else {
			// 		T.setVisible(false);
			// 	}
			// 	if (o.UxFcTaxDeterminationDate === 0) {
			// 		q.setVisible(false);
			// 	} else {
			// 		q.setVisible(true);
			// 	}
			// 	t.rebindTable();
			// 	if (o.UxFcUnplannedDeliveryCostTaxCode === 0) {
			// 		D.setVisible(false);
			// 	} else {
			// 		D.setVisible(true);
			// 	}
			// },
			// _navToSimulationCallBack: function () {
			// 	this.showBusyDialog(false);
			// 	var i = this.getIsSharedDraft();
			// 	var D = this.oModelFacade.getDraftId();
			// 	var s = this.getMode();
			// 	if (!D) {
			// 		D = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/NodeKey");
			// 	}
			// 	this.getRouter().navTo(C.ROUTE_SIMULATION, {
			// 		SharedDraft: i,
			// 		DraftId: D,
			// 		Mode: s
			// 	}, false);
			// },
			// onCrossAppNavigationOutputMsgLinkPress: function () {
			// 	var s = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/SupplierInvoice");
			// 	var i = this.oDataModel.getProperty("/" + this.oModelFacade.getRootPath() + "/FiscalYear");
			// 	if (s && i) {
			// 		var p = {
			// 			target: {
			// 				semanticObject: C.SUPPLIER_INVOICE,
			// 				action: C.OUTBOUND_NAVIGATION_ACTION_NAST
			// 			},
			// 			params: {
			// 				"SupplierInvoice": s,
			// 				"FiscalYear": i
			// 			}
			// 		};
			// 		this.oAppController.navigateToExternalApplication(p, this);
			// 	}
			// },
			// onPORefItemDetailPress: function (D) {
			// 	this.sAccAssBindingPathItem = D.getSource().getBindingContext().getPath();
			// 	if (this.oModelFacade.hasPendingChanges()) {
			// 		var s = jQuery.proxy(this._navToDetailsCallBack, this);
			// 		M.removeAllMessages();
			// 		this.submitChanges(null, s);
			// 	} else {
			// 		this._navToDetailsCallBack();
			// 	}
			// },
			// _navToDetailsCallBack: function () {
			// 	this.showBusyDialog(false);
			// 	var i = this.sAccAssBindingPathItem.substr(1);
			// 	var I = this.getIsSharedDraft();
			// 	var D = this.oModelFacade.getDraftId();
			// 	var s = this.getMode();
			// 	this.getRouter().navTo(C.ROUTE_DETAILS, {
			// 		Item: i,
			// 		SharedDraft: I,
			// 		DraftId: D,
			// 		Mode: s
			// 	}, false);
			// },
			// onPaymentBlockingReasonPress: function () {
			// 	if (this.oModelFacade.hasPendingChanges()) {
			// 		var s = jQuery.proxy(this._navToPaymentBlockingReasonCallBack, this);
			// 		this.submitChanges(null, s);
			// 	} else {
			// 		this._navToPaymentBlockingReasonCallBack();
			// 	}
			// },
			// _navToPaymentBlockingReasonCallBack: function () {
			// 	this.showBusyDialog(false);
			// 	var D = this.oModelFacade.getDraftId();
			// 	var s = this.getMode();
			// 	this.getRouter().navTo(C.ROUTE_PAYMENT_BLOCKING_REASON, {
			// 		DraftId: D,
			// 		Mode: s
			// 	}, false);
			// },
			// navBack: function () {
			// 	this.oAppController.navBack();
			// },
			// initCrossAdvancedAppNavigation: function () {
			// 	if (sap.ui.Device.system.desktop === true && this.oAppController.oCrossAppNavigator) {
			// 		this.navigateToAdvancedApp();
			// 	} else {
			// 		m.error(this.oResourceBundle.getText("YMSG_WRONG_DEVICE_TYPE"), {
			// 			onClose: jQuery.proxy(function () {
			// 				this.navBack();
			// 			}, this),
			// 			styleClass: this.getStyleClass()
			// 		});
			// 	}
			// },
			// navigateToAdvancedApp: function () {
			// 	var p = this.getView().getBindingContext().getPath() + "/FeaturesAreIncompatibleNoPopup";
			// 	var i = this.oDataModel.getProperty(p);
			// 	if (i && i === true) {
			// 		var P = this.getUrlParameter("SuplrInvcAdvncdIsShownInPlace");
			// 		if (P && (P.toLowerCase() === "true" || P.toLowerCase() === "x")) {
			// 			this.oParentController.oAppController.oCrossAppNavigator.toExternal({
			// 				target: {
			// 					semanticObject: "SupplierInvoice",
			// 					action: "displayAdvanced"
			// 				},
			// 				params: {
			// 					"SupplierInvoice": [this.oParentController.oModelFacade.getRootProperty(C.SUPPLIER_INVOICE)],
			// 					"FiscalYear": [this.oParentController.oModelFacade.getRootProperty(C.FISCAL_YEAR)],
			// 					"sap-ushell-navmode": "inplace"
			// 				}
			// 			});
			// 		} else {
			// 			this.oAppController.oCrossAppNavigator.toExternal({
			// 				target: {
			// 					semanticObject: "SupplierInvoice",
			// 					action: "displayAdvanced"
			// 				},
			// 				params: {
			// 					"SupplierInvoice": [this.oModelFacade.getRootProperty(C.SUPPLIER_INVOICE)],
			// 					"FiscalYear": [this.oModelFacade.getRootProperty(C.FISCAL_YEAR)],
			// 					"sap-ushell-navmode": "explace"
			// 				}
			// 			});
			// 		}
			// 	} else {
			// 		if (!this.oAdvancedInvoiceDialog) {
			// 			var o = new k(this);
			// 			this.oAdvancedInvoiceDialog = sap.ui.xmlfragment(this.createId(C.DIALOG_FRAGMENT_PREFIX), C.DIALOG_FRAGMENT_ADVANCED_INVOICE, o);
			// 			var s = this.getAppController().getView();
			// 			s.addDependent(this.oAdvancedInvoiceDialog);
			// 			this.oAdvancedInvoiceDialog.open();
			// 		}
			// 	}
			// },
			// getUrlParameter: function (p) {
			// 	var P;
			// 	if (U.fromQuery) {
			// 		P = U.fromQuery(window.location.href).get(p);
			// 	} else {
			// 		if ("URLSearchParams" in window) {
			// 			var u = new window.URLSearchParams(window.location.href);
			// 			P = u.get(p);
			// 		}
			// 	}
			// 	return P;
			// },
			// navigateToReversedDocument: function () {
			// 	this.oAppController.oCrossAppNavigator.toExternal({
			// 		target: {
			// 			semanticObject: "SupplierInvoice",
			// 			action: "display"
			// 		},
			// 		params: {
			// 			"SupplierInvoice": [this.oModelFacade.getRootProperty(C.REVERSE_DOCUMENT)],
			// 			"FiscalYear": [this.oModelFacade.getRootProperty(C.REVERSE_DOCUMENT_FISCAL_YEAR)]
			// 		}
			// 	});
			// },
			// onBeforeSmartLinkExternalAppNavigation: function (o) {
			// 	var s = o.getParameters();
			// 	this.oAppController.handleExternalAppNavigation(s, this, this.onSmartLinkExternalAppNavigationSuccess);
			// },
			// onSmartLinkExternalAppNavigationSuccess: function (s) {
			// 	if (s) {
			// 		s.open();
			// 	}
			// },
			// onExit: function () {
			// 	A.destroyAttachmentComponent();
			// 	c.destroyChinaVATInvoiceComponent();
			// 	S.destroySituationComponent();
			// 	W.destroyWorkflowComponent();
			// }
	});
	return n;
});