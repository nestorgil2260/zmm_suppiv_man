jQuery.sap.declare("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.Component");

// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "ui.s2p.mm.supplinvoice.manage.s1",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/MM_SUPPIV_MANS1"
		// we use a URL relative to our own component
		// extension application is deployed with customer namespace
});

this.ui.s2p.mm.supplinvoice.manage.s1.Component.extend("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.Component", {
	metadata: {
		manifest: "json"
	}
});