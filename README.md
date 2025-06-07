# Leaflet.WorkedAllBritain

A layer for Leaflet.js to display ["Worked All Britain"](https://wab.intermip.net/default.php) grids.

Used in some of my amateur radio mapping tools such as [Field Spotter](https://fieldspotter.radio) and the [QSO Map Tool](https://qsomap.m0trt.radio).

## Features

* Britain, Northern Ireland and Channel Islands covered
* Detail level based on zoom
* Avoids rendering off-screen small squares for efficient CPU/memory use
* Deconfliction of small squares around overlapping regions

![Screenshot](/docs/screenshot1.png) ![Screenshot](/docs/screenshot2.png) ![Screenshot](/docs/screenshot3.png) ![Screenshot](/docs/screenshot4.png)

## Third-Party Libraries & Thanks

The project contains self-hosted modified copies of classes from Chris Veness' [Geodesy library](https://github.com/chrisveness/geodesy/), located in the `/modules/geodesy` directory. These have been modified allow the "OV" square for OSGB, to support the Irish grid system, and add parsing of Channel Islands grid references, for use with the Worked All Britain squares layer. This code is subject to the MIT licence. It is used with many thanks.

Thanks are also due to [HA8TKS](https://github.com/ha8tks) for their Maidenhead, ITU & CQ zone libraries, which I used as an example of how to create a Leaflet layer class.
