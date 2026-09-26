import { config } from "@vue/test-utils";
import clickOutside from "@/directives/clickOutside";

window.config = { BaseApi: "http://test/api" };

config.global.directives = { "click-outside": clickOutside };
