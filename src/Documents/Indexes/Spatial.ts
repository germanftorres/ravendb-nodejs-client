import { throwError } from "../../Exceptions";

// about 4.78 meters at equator, should be good enough 
// (see: http://unterbahn.com/2009/11/metric-dimensions-of-geohash-partitions-at-the-equator/)
export const DEFAULT_GEOHASH_LEVEL = 9;

// about 4.78 meters at equator, should be good enough
export const DEFAULT_QUAD_TREE_LEVEL = 23;

export type SpatialFieldType = "Geography" | "Cartesian";

export type SpatialSearchStrategy =
    "GeohashPrefixTree"
    | "QuadPrefixTree"
    | "BoundingBox";

export type SpatialUnits = "Kilometers" | "Miles";

export class SpatialOptions {

    public type: SpatialFieldType;
    public strategy: SpatialSearchStrategy;
    public maxTreeLevel: number;
    public minX: number;
    public maxX: number;
    public minY: number;
    public maxY: number;

    // Circle radius units, only used for geography  indexes
    public units: SpatialUnits;

    public constructor(options?: SpatialOptions) {
        options = options || {} as SpatialOptions;
        this.type = options.type || "Geography";
        this.strategy = options.strategy || "GeohashPrefixTree";
        this.maxTreeLevel = options.maxTreeLevel || DEFAULT_GEOHASH_LEVEL;
        this.minX = options.minX || -180;
        this.maxX = options.maxX || 180;
        this.minY = options.minY || -90;
        this.maxY = options.maxY || 90;
        this.units = options.units || "Kilometers";
    }

    // public equals(obj: object): boolean {
    //     if (this == obj) {
    //         return true;
    //     }

    //     if (obj == null)
    //         return false;
    //     if (getClass() != obj.getClass())
    //         return false;
    //     SpatialOptions other = (SpatialOptions) obj;

    //     boolean result = type == other.getType() && strategy == other.strategy;
    //     if (type == SpatialFieldType.GEOGRAPHY) {
    //         result = result && units == other.units;
    //     }
    //     if (strategy != SpatialSearchStrategy.BOUNDING_BOX) {
    //         result = result && maxTreeLevel == other.maxTreeLevel;
    //         if (type == SpatialFieldType.CARTESIAN) {
    //             result = result && minX == other.minX
    //                     && maxX == other.maxX
    //                     && minY == other.minY
    //                     && maxY == other.maxY;
    //         }
    //     }

    //     return result;
    // }

    // @Override
    // public int hashCode() {
    //     HashCodeBuilder builder = new HashCodeBuilder();
    //     builder.append(type);
    //     builder.append(strategy);
    //     if (type == SpatialFieldType.GEOGRAPHY) {
    //         builder.append(units.hashCode());
    //     }
    //     if (strategy != SpatialSearchStrategy.BOUNDING_BOX) {
    //         builder.append(maxTreeLevel);
    //         if (type == SpatialFieldType.CARTESIAN) {
    //             builder.append(minX).append(maxX).append(minY).append(maxY);
    //         }
    //     }

    //     return builder.hashCode();
    // }
}

export class SpatialOptionsFactory {
    public getGeography(): GeographySpatialOptionsFactory {
        return new GeographySpatialOptionsFactory();
    }

    public getCartesian(): CartesianSpatialOptionsFactory {
        return new CartesianSpatialOptionsFactory();
    }
}

export class CartesianSpatialOptionsFactory {

    public boundingBoxIndex(): SpatialOptions {
        const opts: SpatialOptions = new SpatialOptions();
        opts.type = "Cartesian";
        opts.strategy = "BoundingBox";
        return opts;
    }

    public quadPrefixTreeIndex(maxTreeLevel: number, bounds: SpatialBounds): SpatialOptions {
        if (maxTreeLevel === 0) {
            throwError("InvalidArgumentException", "maxTreeLevel can't be 0.");
        }

        const opts = new SpatialOptions();
        opts.type = "Cartesian";
        opts.maxTreeLevel = maxTreeLevel;
        opts.strategy = "QuadPrefixTree";
        opts.minX = bounds.minX;
        opts.minY = bounds.minY;
        opts.maxX = bounds.maxX;
        opts.maxY = bounds.maxY;

        return opts;
    }
}

export class SpatialBounds {
    public minX: number;
    public maxX: number;
    public minY: number;
    public maxY: number;

    // @Override
    // public int hashCode() {
    //     return new HashCodeBuilder().append(maxX).append(maxY).append(minX).append(minY).hashCode();
    // }

    // @Override
    // public boolean equals(Object obj) {
    //     if (this == obj)
    //         return true;
    //     if (obj == null)
    //         return false;
    //     if (getClass() != obj.getClass())
    //         return false;
    //     SpatialBounds other = (SpatialBounds) obj;
    //     return new EqualsBuilder()
    // .append(maxX, other.maxX).append(maxY, other.maxY).append(minX, other.minX).append(minY, other.minY).isEquals();
    // }
}

export class GeographySpatialOptionsFactory {

    /**
     * Defines a Geohash Prefix Tree index using a default Max Tree Level {@link SpatialOptions}
     * @param circleRadiusUnits Units to set
     * @return Spatial options
     */
    public defaultOptions(circleRadiusUnits?: SpatialUnits): SpatialOptions {
        circleRadiusUnits = circleRadiusUnits || "Kilometers";
        return this.geohashPrefixTreeIndex(0, circleRadiusUnits);
    }

    public boundingBoxIndex(circleRadiusUnits?: SpatialUnits): SpatialOptions {
        circleRadiusUnits = circleRadiusUnits || "Kilometers";
        const ops = new SpatialOptions();
        ops.type = "Geography";
        ops.strategy = "BoundingBox";
        ops.units = circleRadiusUnits;
        return ops;
    }

    public geohashPrefixTreeIndex(maxTreeLevel: number, circleRadiusUnits?: SpatialUnits): SpatialOptions {
        circleRadiusUnits = circleRadiusUnits || "Kilometers";
        if (maxTreeLevel === 0) {
            maxTreeLevel = DEFAULT_GEOHASH_LEVEL;
        }

        const opts = new SpatialOptions();
        opts.type = "Geography";
        opts.maxTreeLevel = maxTreeLevel;
        opts.strategy = "GeohashPrefixTree";
        opts.units = circleRadiusUnits;
        return opts;
    }

    public quadPrefixTreeIndex(maxTreeLevel: number, circleRadiusUnits: SpatialUnits): SpatialOptions {
        circleRadiusUnits = circleRadiusUnits || "Kilometers";
        if (maxTreeLevel === 0) {
            maxTreeLevel = DEFAULT_QUAD_TREE_LEVEL;
        }

        const opts = new SpatialOptions();
        opts.type = "Geography";
        opts.maxTreeLevel = maxTreeLevel;
        opts.strategy = "QuadPrefixTree";
        opts.units = circleRadiusUnits;
        return opts;
    }
}

export type SpatialRelation =  
    "Within"
   | "Contains"
   | "Disjoint"
   | "Intersects";
