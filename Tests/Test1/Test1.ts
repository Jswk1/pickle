import { Given, Then, When } from "../../Runner";

Given("Something", async function () {
    this.variables["test"] = 5;
});

When("I do something", async function () {

});

Then("I check something", async function () {
    // throw new Error();
});