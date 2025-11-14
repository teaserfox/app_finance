import {Router} from "@/router";

export type RouteType = {
    path: string;
    protected: boolean;
    template: string;
    name: string;
    load: (router: Router, container: HTMLElement) => void;
};
