sap.ui.define([
	"ui/s2p/mm/supplinvoice/manage/s1/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/CommonHelper",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/Conversions",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/RoutingHelper",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/MessageHelper",
	"sap/ui/core/message/MessageManager",
	"ui/s2p/mm/supplinvoice/manage/s1/utils/Constants",
	"sap/m/MessageBox"
], function (B, J, C, a, R, M, b, c, d) {
	"use strict";
	var g = sap.ui.controller("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.controller.AppCustom", {
		getS1Controller: function () {
				return this.oS1Controller;
			}
			//    _initCrossApplicationNavigation: function () {
			//        if (!this.oCrossAppNavigator) {
			//            this.oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			//        }
			//    },
			//    handleInvoiceCanceled: function (s) {
			//        var S = s;
			//        if (typeof S === "string") {
			//            S = this;
			//        }
			//        S.oAppController.reloadInvoice(jQuery.proxy(S.onModelInitialized, S));
			//    },
			//    setMainScreenController: function (s) {
			//        this.oS1Controller = s;
			//    },
			//    reloadInvoice: function (h) {
			//        this.getModelFacade().reloadInvoice(h);
			//    },
			//    handleStartup: function (s) {
			//        if (s.Mode === c.MODE_CREATE && s.NodeKey === c.EMPTY_GUID) {
			//            this.checkForExistingDraft(s);
			//        } else if (s.Mode === c.MODE_EDIT) {
			//            this.editSupplierInvoiceNumber = s.SupplierInvoice;
			//            this.editFiscalYear = s.FiscalYear;
			//            this._checkIfEditIsAllowed(s);
			//        } else {
			//            this.startApp(s);
			//        }
			//    },
			//    checkForExistingDraft: function (s, D) {
			//        var r = {};
			//        r.success = jQuery.proxy(function (o) {
			//            var h;
			//            var i;
			//            if (o.results && o.results[0]) {
			//                h = o.results[0].DraftId;
			//                i = o.results[0].DraftIsInitial;
			//                if (h) {
			//                    var j = jQuery.proxy(function (k) {
			//                        if (k === d.Action.YES) {
			//                            s.NodeKey = h;
			//                        } else if (k === d.Action.NO) {
			//                            s.State = "";
			//                        }
			//                        this.startApp(s);
			//                    }, this);
			//                    if (D) {
			//                        s.NodeKey = h;
			//                        this.startApp(s);
			//                    } else {
			//                        if (i) {
			//                            s.State = "";
			//                            this.startApp(s);
			//                        } else {
			//                            d.show(this.oResourceBundle.getText("YMSG_EXISTING_DRAFT"), {
			//                                icon: d.Icon.QUESTION,
			//                                title: this.oResourceBundle.getText("XTIT_EXISTING_DRAFT"),
			//                                actions: [
			//                                    d.Action.YES,
			//                                    d.Action.NO
			//                                ],
			//                                onClose: j
			//                            });
			//                        }
			//                    }
			//                }
			//            } else {
			//                this.startApp(s);
			//            }
			//        }, this);
			//        this.showBusyDialog(true);
			//        this._readValueListsIfReq();
			//        this.getModel().read("/UserDraftInfos", r);
			//    },
			//    startApp: function (s) {
			//        this.showBusyDialog(true);
			//        var o = s;
			//        M.removeAllMessages();
			//        if (this.oS1Controller.oMessagePopover) {
			//            this.oS1Controller.oMessagePopover.close();
			//        }
			//        if (!o) {
			//            o = {
			//                SupplierInvoice: "",
			//                FiscalYear: "",
			//                State: "",
			//                Mode: c.MODE_CREATE
			//            };
			//            if (!o.NodeKey) {
			//                o.NodeKey = c.EMPTY_GUID;
			//            }
			//        }
			//        this.applyAppMode(o.Mode);
			//        if (this.getModelFacade().hasPendingChanges()) {
			//            this.getModelFacade().resetChanges();
			//        }
			//        this._readValueListsIfReq(true);
			//        this.getModelFacade().prepare(o, jQuery.proxy(function (h, m) {
			//            if (m !== o.Mode) {
			//                this.applyAppMode(m);
			//            }
			//            this.oS1Controller.onModelInitialized(h);
			//        }, this), jQuery.proxy(function () {
			//            var u = this.oResourceBundle.getText("MESSAGE_ERROR_OCCURED");
			//            var m = u;
			//            var h = sap.ui.getCore().getMessageManager();
			//            var i = h.getMessageModel();
			//            if (i) {
			//                var D = i.getData();
			//                if (D && D.length === 1) {
			//                    m = D[0].message;
			//                }
			//            }
			//            d.error(m, {
			//                title: u,
			//                styleClass: this.getStyleClass(),
			//                onClose: jQuery.proxy(function () {
			//                    if (s.Context && s.Context.WasDisplayMode) {
			//                        this.getAppController().startAppInDisplayMode();
			//                    } else {
			//                        this.navBack();
			//                    }
			//                }, this)
			//            });
			//        }, this.oS1Controller));
			//    },
			//    _startAppInDisplayMode: function (s) {
			//        if (!s.Context || !s.Context.WasDisplayMode || s.Context.WasDisplayMode === false) {
			//            s.Mode = c.MODE_DISPLAY;
			//            this.startApp(s);
			//        }
			//    },
			//    _deleteDraftAndStartApp: function (o, s) {
			//        var p = {
			//            groupId: c.MAIN_BATCH_GROUP,
			//            changeSetId: c.SECOND_CHANGESET
			//        };
			//        s.State = "";
			//        var P = "/" + this.getModelFacade().buildRootPath(o, c.INVOICE_STATE_DRAFT, s.SupplierInvoice, s.FiscalYear);
			//        this.getModel().remove(P, p);
			//        this.startApp(s);
			//    },
			//    _checkIfEditIsAllowed: function (s) {
			//        var S = jQuery.proxy(function (D) {
			//            var r = D.IsEditAllowed;
			//            if (r.DocumentStateInvalid) {
			//                this._startAppInDisplayMode(s);
			//                this.showBusyDialog(false);
			//                d.show(this.oResourceBundle.getText("YMSG_INVOICESTATE_INVALID"), {
			//                    icon: d.Icon.INFO,
			//                    title: this.oResourceBundle.getText("XTIT_INVOICESTATE_INVALID"),
			//                    actions: [d.Action.OK]
			//                });
			//            } else if (r.ForeignLockExists) {
			//                this._startAppInDisplayMode(s);
			//                this.showBusyDialog(false);
			//                d.show(this.oResourceBundle.getText("YMSG_INVOICE_LOCKED"), {
			//                    icon: d.Icon.ERROR,
			//                    title: this.oResourceBundle.getText("XTIT_INVOICE_LOCKED"),
			//                    actions: [d.Action.OK]
			//                });
			//            } else if (r.OwnDraftExists) {
			//                if (r.OwnDraftInvalidated) {
			//                    d.show(this.oResourceBundle.getText("YMSG_OUTDATED_CHANGES_EXIST"), {
			//                        icon: d.Icon.ERROR,
			//                        title: this.oResourceBundle.getText("XTIT_OUTDATED_CHANGES_EXIST"),
			//                        actions: [d.Action.OK],
			//                        onClose: jQuery.proxy(function (o) {
			//                            if (o === d.Action.OK) {
			//                                this.startApp(s);
			//                            }
			//                        }, this)
			//                    });
			//                } else {
			//                    d.show(this.oResourceBundle.getText("YMSG_CHANGES_EXIST"), {
			//                        icon: d.Icon.ERROR,
			//                        title: this.oResourceBundle.getText("XTIT_CHANGES_EXIST"),
			//                        actions: [
			//                            d.Action.YES,
			//                            d.Action.NO
			//                        ],
			//                        onClose: jQuery.proxy(function (o) {
			//                            if (o === d.Action.YES) {
			//                                s.NodeKey = r.OwnDraftId;
			//                                s.State = c.INVOICE_STATE_DRAFT;
			//                                this.startApp(s);
			//                            }
			//                            if (o === d.Action.NO) {
			//                                this._deleteDraftAndStartApp(r.OwnDraftId, s);
			//                            }
			//                        }, this)
			//                    });
			//                }
			//            } else if (r.ForeignDraftExists) {
			//                if (r.ForeignDraftIsExpired) {
			//                    d.show(this.oResourceBundle.getText("YMSG_INVOICE_LOCKED_UNLOCKABLE"), {
			//                        icon: d.Icon.ERROR,
			//                        title: this.oResourceBundle.getText("XTIT_INVOICE_LOCKED_UNLOCKABLE"),
			//                        actions: [
			//                            d.Action.YES,
			//                            d.Action.NO
			//                        ],
			//                        onClose: jQuery.proxy(function (o) {
			//                            if (o === d.Action.YES) {
			//                                this.startApp(s);
			//                            }
			//                            if (o === d.Action.NO) {
			//                                this.showBusyDialog(false);
			//                            }
			//                        }, this)
			//                    });
			//                } else {
			//                    this._startAppInDisplayMode(s);
			//                    this.showBusyDialog(false);
			//                    d.show(this.oResourceBundle.getText("YMSG_INVOICE_LOCKED"), {
			//                        icon: d.Icon.ERROR,
			//                        title: this.oResourceBundle.getText("XTIT_INVOICE_LOCKED"),
			//                        actions: [d.Action.OK]
			//                    });
			//                }
			//            } else {
			//                this.startApp(s);
			//            }
			//        }, this);
			//        this.showBusyDialog(true);
			//        var u = {
			//            SupplierInvoice: s.SupplierInvoice,
			//            FiscalYear: s.FiscalYear
			//        };
			//        this._readValueListsIfReq();
			//        this.getModel().callFunction("/IsEditAllowed", {
			//            urlParameters: u,
			//            method: "GET",
			//            success: S,
			//            error: jQuery.proxy(this.oS1Controller.onRequestFailed, this.oS1Controller)
			//        });
			//    },
			//    _readValueListsIfReq: function (m) {
			//        var v = this.getModel("valueLists");
			//        var V = "/VL_FV_MRM_REFERENZBELEGTYP";
			//        var h = "/VL_FV_MRM_VORGANG";
			//        var p;
			//        if (!v.getProperty(V)) {
			//            p = {
			//                urlParameters: {
			//                    "$orderby": "Text asc",
			//                    "$select": "Code,Text"
			//                },
			//                success: function (i) {
			//                    v.setProperty(V, i.results);
			//                    v.updateBindings();
			//                }.bind(this)
			//            };
			//            if (m) {
			//                p.groupId = c.MAIN_BATCH_GROUP;
			//                p.changeSetId = c.MAIN_CHANGESET;
			//            }
			//            this.getModel().read(V, p);
			//        }
			//        if (!v.getProperty(h)) {
			//            p = {
			//                urlParameters: {
			//                    "$orderby": "Text asc",
			//                    "$select": "Code,Text"
			//                },
			//                success: function (i) {
			//                    v.setProperty(h, i.results);
			//                    v.updateBindings();
			//                }.bind(this)
			//            };
			//            if (m) {
			//                p.groupId = c.MAIN_BATCH_GROUP;
			//                p.changeSetId = c.MAIN_CHANGESET;
			//            }
			//            this.getModel().read(h, p);
			//        }
			//    },
			//    restartOnError: function () {
			//        if (!this.isRestartOngoing()) {
			//            this.setRestartOngoing(true);
			//            this.startAppInDisplayMode();
			//        }
			//    },
			//    handleExternalAppNavigation: function (p, o, s) {
			//        if (this.getModelFacade().hasPendingChanges()) {
			//            o.submitChanges(null, jQuery.proxy(s, this, p));
			//        } else {
			//            s(p);
			//        }
			//    },
			//    navigateToExternalApplication: function (p, o) {
			//        if (this.oCrossAppNavigator) {
			//            if (this.getModelFacade().hasPendingChanges()) {
			//                var s = jQuery.proxy(this.navigateToExternalApplication, this);
			//                o.submitChanges(null, s);
			//            } else {
			//                this.oCrossAppNavigator.toExternal(p);
			//            }
			//        }
			//    }
	});
	return g;
});