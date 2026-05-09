'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'aadhaar_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'last_login_at');
    await queryInterface.removeColumn('users', 'aadhaar_verified');
  },
};
