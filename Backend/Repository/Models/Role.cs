using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Repository.Models;

public partial class Role
{
    [Key]
    public Guid RoleId { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string RoleName { get; set; }

    [StringLength(255)]
    public string Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
