L.WorkedAllBritain = L.LayerGroup.extend({

    options: {
        // Line and label color
        color: 'rgba(80, 80, 80, 1)',
        // Grid squares to draw
        gbSquares: ["HP", "HT", "HU", "HW", "HX", "HY", "HZ", "NA", "NB", "NC", "ND", "NF", "NG", "NH", "NJ", "NK", "NL", "NM", "NN", "NO", "NR", "NS", "NT", "NU", "NW", "NX", "NY", "NZ", "OV", "SC", "SD", "SE", "SH", "SJ", "SK", "SM", "SN", "SO", "SP", "SR", "SS", "ST", "SU", "SV", "SW", "SX", "SY", "SZ", "TA", "TF", "TG", "TL", "TM", "TR", "TQ", "TV"],
        niSquares: ["C", "D", "G", "H", "J"],
        ciSquares: ["WA", "WV"]
    },

    initialize: function (options) {
        // Initialise the LayerGroup superclass and set the options for this class.
        L.LayerGroup.prototype.initialize.call(this);
        L.Util.setOptions(this, options);

        // Workaround to load the geodesy modules in non-modular code. Once we have loaded all three modules, trigger a
        // first draw.
        import("https://ianrenton.github.io/Leaflet.WorkedAllBritain/modules/geodesy/osgridref.js")
            .then(module => {
                this._osGridLibrary = module;
                if (this._ieGridLibrary && this._utmLibrary) {
                    this.redraw();
                }
            })
            .catch(error => {
                console.log("Error loading OS Grid Ref library, GB WAB squares may not be available.");
                console.log(error);
            });
        import("https://ianrenton.github.io/Leaflet.WorkedAllBritain/modules/geodesy/iegridref.js")
            .then(module => {
                this._ieGridLibrary = module;
                if (this._osGridLibrary && this._utmLibrary) {
                    this.redraw();
                }
            })
            .catch(error => {
                console.log("Error loading IE Grid Ref library, NI WAB squares may not be available.");
                console.log(error);
            });
        import("https://ianrenton.github.io/Leaflet.WorkedAllBritain/modules/geodesy/utm_ci.js")
            .then(module => {
                this._utmLibrary = module;
                if (this._osGridLibrary && this._ieGridLibrary) {
                    this.redraw();
                }
            })
            .catch(error => {
                console.log("Error loading UTM library, Channel Islands WAB squares may not be available.");
                console.log(error);
            });
    },

    onAdd: function (map) {
        this._map = map;
        var grid = this.redraw();
        map.on('moveend', function () { grid.redraw(); });
        map.on('zoomend', function () { grid.redraw(); });
        this.eachLayer(map.addLayer, map);
    },

    onRemove: function (map) {
        map.off('moveend', this.map);
        map.off('zoomend', this.map);
        this.eachLayer(this.removeLayer, this);
    },

    redraw: function () {
        // Don't proceed unless we have a map object and our libraries are loaded
        if (this._map && this._osGridLibrary && this._ieGridLibrary && this._utmLibrary) {
            // Remove existing content
            this.eachLayer(this.removeLayer, this);

            // Determine detail level based on current map zoom.
            const detailLevel = (map.getZoom() > 4) ? (map.getZoom() > 8) ? 2 : 1 : 0;

            // Generate new content for the three grid systems.
            this.options.gbSquares.forEach(squareRef => {
                this._addWABGraphicsForSquare(squareRef, "GB", detailLevel);
            });
            this.options.niSquares.forEach(squareRef => {
                this._addWABGraphicsForSquare(squareRef, "IE", detailLevel);
            });
            this.options.ciSquares.forEach(squareRef => {
                this._addWABGraphicsForSquare(squareRef, "CI", detailLevel);
            });
        }
        return this;
    },


    // Add WAB graphics to the layer for the given square, using the given grid system ("GB", "IE" or "CI") and the
    // required level of detail.
    _addWABGraphicsForSquare: function (squareRef, gridSystem, detailLevel) {
        if (detailLevel === 0 || detailLevel === 1) {
            // If detail level is 0 or 1, we want a single large square.
            const swCorner = this._gridRefToLatLon(squareRef + " 00000 00000", gridSystem);
            const nwCorner = this._gridRefToLatLon(squareRef + " 99999 00000", gridSystem);
            const neCorner = this._gridRefToLatLon(squareRef + " 99999 99999", gridSystem);
            const seCorner = this._gridRefToLatLon(squareRef + " 00000 99999", gridSystem);
            const centre = this._gridRefToLatLon(squareRef + " 50000 50000", gridSystem);

            let square = L.polygon([swCorner, nwCorner, neCorner, seCorner], {color: this.options.color, interactive: false});
            this.addLayer(square);

            // Additionally if detail level is 1, we want to label it.
            if (detailLevel === 1) {
                let label = new L.marker(centre, {
                    icon: new L.DivIcon({
                        html: '<span style="position: relative; top: -40%; left: -40%; text-align: center; cursor: hand; color:'+this.options.color+'; font-weight: bold; font-size:120%;">' + squareRef + '</font></span>',
                        className: 'wabSquareLabel' // Prevent default background & border and provide ability to customise
                    })
                }, clickable=false);
                this.addLayer(label);
            }

        } else if (detailLevel === 2) {
            // If detail level is 2, we want to generate all the inner squares (with labels)
            // instead of just one square. But, doing this for every square will cause CPU issues,
            // so we only want to generate graphics if they would actually end up on screen.
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {

                    // Bail out if we have a grid reference that doesn't apply. This is where GB grid overlaps with NI etc.
                    // are deconflicted.
                    if (this._validSmallSquare(squareRef, i, j)) {

                        // If we get this far, now calculate the coordinates of the box.
                        const swCorner = this._gridRefToLatLon(squareRef + " " + i + "0000 " + j + "0000", gridSystem);
                        const nwCorner = this._gridRefToLatLon(squareRef + " " + i + "9999 " + j + "0000", gridSystem);
                        const neCorner = this._gridRefToLatLon(squareRef + " " + i + "9999 " + j + "9999", gridSystem);
                        const seCorner = this._gridRefToLatLon(squareRef + " " + i + "0000 " + j + "9999", gridSystem);
                        const centre = this._gridRefToLatLon(squareRef + " " + i + "5000 " + j + "5000", gridSystem);

                        // Find out if this box is going to be on our screen. If not, don't draw anything.
                        if (map.getBounds().contains(swCorner) || map.getBounds().contains(nwCorner)
                            || map.getBounds().contains(neCorner) || map.getBounds().contains(seCorner)) {
                            let square = L.polygon([swCorner, nwCorner, neCorner, seCorner], {color: this.options.color, interactive: false});
                            this.addLayer(square);

                            let label = new L.marker(centre, {
                                icon: new L.DivIcon({
                                    html: '<span style="position: relative; top: -20%; left: -100%; text-align: center; cursor: hand; color:'+this.options.color+'; font-weight: bold; font-size:120%;">' + squareRef + i + j + '</font></span>',
                                    className: 'wabSquareLabelLong' // Prevent default background & border and provide ability to customise
                                })
                            }, clickable=false);
                            this.addLayer(label);
                        }
                    }
                }
            }
        }
    },

    // Determine if a given small square is OK to draw. This is where e.g. overlapping GB and IE squares are
    // deconflicted in the Irish Sea.
    _validSmallSquare: function (squareRef, i, j) {
        let valid = true;
        if (squareRef === "WA" && j > 1) {
            valid = false;
        } else if (squareRef === "TR" && i > 4 && j < 5) {
            valid = false;
        } else if (squareRef === "SM" && i < 4) {
            valid = false;
        } else if (squareRef === "TV" && i === 9 && j === 0) {
            valid = false;
        } else if (squareRef === "NW" && i < 9) {
            valid = false;
        } else if (squareRef === "NR" && i < 5 && j < 3) {
            valid = false;
        } else if (squareRef === "C" && j > 6) {
            valid = false;
        } else if (squareRef === "D" && (i > 5 || j > 5 || (i > 2 && j > 3))) {
            valid = false;
        } else if (squareRef === "J" && i > 6) {
            valid = false;
        }
        return valid;
    },

    // Convert the given grid reference to lat/lon, using the given grid system ("GB", "IE" or "CI")
    _gridRefToLatLon: function (grid, gridSystem) {
        if (gridSystem === "GB") {
            return this._osgbGridRefToLatLon(grid);
        } else if (gridSystem === "IE") {
            return this._osieGridRefToLatLon(grid);
        } else if (gridSystem === "CI") {
            return this._ciGridRefToLatLon(grid);
        } else {
            return null;
        }
    },

    // OSGB grid reference to lat/lon
    _osgbGridRefToLatLon: function (grid) {
        if (this._osGridLibrary) {
            return this._osGridLibrary.default.parse(grid).toLatLon();
        } else {
            return null;
        }
    },

    // Lat/lon to OSGB grid reference
    _latLonToOSGBGridRef: function (lat, lon) {
        if (this._osGridLibrary) {
            return new this._osGridLibrary.LatLon(lat, lon).toOsGrid();
        } else {
            return null;
        }
    },

    // OSIE grid reference to lat/lon
    _osieGridRefToLatLon: function (grid) {
        if (this._ieGridLibrary) {
            return this._ieGridLibrary.default.parse(grid).toLatLon();
        } else {
            return null;
        }
    },

    // Lat/lon to OSIE grid reference
    _latLonToOSIEGridRef: function (lat, lon) {
        if (this._ieGridLibrary) {
            return new this._ieGridLibrary.LatLon(lat, lon).toOsGrid();
        } else {
            return null;
        }
    },

    // CI grid reference to lat/lon
    _ciGridRefToLatLon: function (grid) {
        if (this._utmLibrary) {
            return this._utmLibrary.default.parseChannelIslandGrid(grid).toLatLon();
        } else {
            return null;
        }
    },

    // Lat/lon to CI grid reference
    _latLonToCIGridRef: function (lat, lon) {
        if (this._utmLibrary) {
            let utm = new this._utmLibrary.LatLon_Utm(lat, lon).toUtm();
            // todo
            return null;
        } else {
            return null;
        }
    }
});

L.workedAllBritain = function (options) {
    return new L.WorkedAllBritain(options);
};
